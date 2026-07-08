import { describe, expect, it } from "vitest";

import {
  buildTacticalPlans,
  createPlanStep,
  createTacticalPlan,
  evaluateTacticalPlans,
  getTacticalPlanMemorySnapshot,
  mapPlanStepToLegalActions,
  rankTacticalPlans,
  rememberTacticalPlanRuntime,
  resetTacticalPlanMemory,
} from "./tactical-plans";
import { buildDeckCapabilityProfile } from "./deck-capabilities";
import {
  buildActionSemanticCandidates,
  type ActionSemanticCandidate,
} from "./action-semantic-candidate";
import type {
  RunnerHandDevelopmentEvaluation,
  RunnerPersistentInstallEvaluation,
} from "./runner-hand-development";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "./runner-run-target-evaluation";
import { evaluateRunnerRunTargets } from "./runner-run-target-evaluation";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";

describe("tactical plan model", () => {
  it("creates a blocked plan with a next remediation step", () => {
    const remediationStep = createPlanStep({
      stepId: "runner.obtain_breaker_coverage:remote_1",
      kind: "search_for_answer",
      desiredActionSemantics: ["search_for_answer", "install_breaker"],
      rationale: ["missing breaker coverage can be solved before the run"],
    });

    const plan = createTacticalPlan({
      planId: "runner.contest_remote:remote_1",
      side: "runner",
      type: "runner.contest_remote",
      priority: 900,
      horizonTurns: 2,
      target: { kind: "server", id: "remote_1" },
      blockers: [
        {
          blockerId: "missing_breaker_coverage:remote_1",
          kind: "missing_breaker_coverage",
          severity: "soft",
          target: { kind: "server", id: "remote_1" },
          removalStepKind: "search_for_answer",
          evidence: ["known ICE path cannot be reached"],
        },
      ],
      currentStep: remediationStep,
      evidence: ["remote contest remains the goal"],
      stateVersion: 7,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.currentStep.kind).toBe("search_for_answer");
    expect(plan.blockers[0]?.removalStepKind).toBe("search_for_answer");
    expect(plan.createdAtStateVersion).toBe(7);
  });

  it("ranks active plans before blocked plans", () => {
    const active = createTacticalPlan({
      planId: "runner.opportunistic_central_run:hq",
      side: "runner",
      type: "runner.opportunistic_central_run",
      status: "active",
      priority: 500,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "probe:hq",
        kind: "probe_central",
        desiredActionSemantics: ["probe_central"],
      }),
      stateVersion: 1,
    });
    const blocked = createTacticalPlan({
      planId: "runner.contest_remote:remote_1",
      side: "runner",
      type: "runner.contest_remote",
      priority: 900,
      horizonTurns: 2,
      blockers: [
        {
          blockerId: "missing_breaker_coverage:remote_1",
          kind: "missing_breaker_coverage",
          severity: "soft",
          evidence: ["needs answer first"],
        },
      ],
      currentStep: createPlanStep({
        stepId: "draw_for_answer:remote_1",
        kind: "draw_for_answer",
        desiredActionSemantics: ["draw_for_answer"],
      }),
      stateVersion: 1,
    });

    expect(
      rankTacticalPlans([blocked, active]).map((plan) => plan.planId),
    ).toEqual([
      "runner.opportunistic_central_run:hq",
      "runner.contest_remote:remote_1",
    ]);
  });

  it("lets active plans outrank progressing plans when the continuity bonus is not enough", () => {
    const progressing = createTacticalPlan({
      planId: "runner.obtain_breaker_coverage:rd",
      side: "runner",
      type: "runner.obtain_breaker_coverage",
      status: "progressing",
      priority: 700,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "draw_for_answer:rd",
        kind: "draw_for_answer",
        desiredActionSemantics: ["draw_for_answer"],
      }),
      stateVersion: 2,
    });
    const strongerProgressing = {
      ...progressing,
      priority: 900,
    };
    const freshActive = createTacticalPlan({
      planId: "runner.contest_remote:remote_2",
      side: "runner",
      type: "runner.contest_remote",
      status: "active",
      priority: 820,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "run_target:remote_2",
        kind: "run_target",
        desiredActionSemantics: ["run"],
      }),
      stateVersion: 2,
    });

    expect(
      rankTacticalPlans([freshActive, progressing]).map((plan) => plan.planId),
    ).toEqual([
      "runner.contest_remote:remote_2",
      "runner.obtain_breaker_coverage:rd",
    ]);
    expect(
      rankTacticalPlans([freshActive, strongerProgressing]).map(
        (plan) => plan.planId,
      ),
    ).toEqual([
      "runner.obtain_breaker_coverage:rd",
      "runner.contest_remote:remote_2",
    ]);
  });

  it("maps a plan step through ActionSemanticCandidate back to LegalAction", () => {
    const action = legalAction("run-hq", "runner", "start_run", {
      serverId: "hq",
    });
    const plan = createTacticalPlan({
      planId: "runner.opportunistic_central_run:hq",
      side: "runner",
      type: "runner.opportunistic_central_run",
      status: "active",
      priority: 700,
      horizonTurns: 1,
      target: { kind: "server", id: "hq" },
      currentStep: createPlanStep({
        stepId: "probe_central:hq",
        kind: "probe_central",
        desiredActionSemantics: ["run"],
      }),
      stateVersion: 1,
    });

    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      [candidateForAction(action)],
      aiInput("runner", [action]),
    );

    expect(mapping.status).toBe("matched");
    expect(mapping.actionCandidateIds).toEqual(["run-hq"]);
    expect(mapping.legalActions[0]?.actionId).toBe("run-hq");
    expect(mapping.step.mappingStatus).toBe("matched");
  });

  it("does not map a targeted plan step to a different targetServerId run", () => {
    const rdAction = legalAction("run-rd", "runner", "start_run", {
      targetServerId: "rd",
    });
    const remoteAction = legalAction("run-remote", "runner", "start_run", {
      targetServerId: "remote_1",
    });
    const plan = createTacticalPlan({
      planId: "runner.obtain_breaker_coverage:rd",
      side: "runner",
      type: "runner.obtain_breaker_coverage",
      status: "progressing",
      priority: 980,
      horizonTurns: 1,
      target: { kind: "server", id: "rd" },
      currentStep: createPlanStep({
        stepId: "run_target:rd",
        kind: "run_target",
        desiredActionSemantics: ["run"],
      }),
      stateVersion: 1,
    });

    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      [
        candidateForActionWithSelectedTargets(remoteAction, []),
        candidateForActionWithSelectedTargets(rdAction, []),
      ],
      aiInput("runner", [remoteAction, rdAction]),
    );

    expect(mapping.status).toBe("matched");
    expect(mapping.actionCandidateIds).toEqual(["run-rd"]);
    expect(mapping.legalActions.map((action) => action.actionId)).toEqual([
      "run-rd",
    ]);
  });

  it("maps search steps from candidate program-search semantics without label hints", () => {
    const action = legalAction(
      "use-smc",
      "runner",
      "trigger_ability",
      {},
      {
        source: "smc-1",
        label: "Use ability",
      },
    );
    const plan = createTacticalPlan({
      planId: "runner.obtain_breaker_coverage:remote_1",
      side: "runner",
      type: "runner.obtain_breaker_coverage",
      status: "active",
      priority: 900,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "search_for_answer:remote_1",
        kind: "search_for_answer",
        desiredActionSemantics: ["breaker_search"],
        rationale: ["need wall coverage"],
      }),
      stateVersion: 1,
    });
    const candidate: ActionSemanticCandidate = {
      ...candidateForAction(action),
      sourceKind: "card",
      sourceCardId: "onr_v1_059_self-modifying-code",
      abilityId: "smc.search_program",
      semanticActionType: "card_ability.trigger",
      actionTacticSignals: ["setup.program_search", "breaker_search"],
      evidence: ["candidate carries program_search semantics"],
    };

    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      [candidate],
      aiInput("runner", [action]),
    );

    expect(mapping.status).toBe("matched");
    expect(mapping.rationale).toEqual(
      expect.arrayContaining([
        expect.stringContaining("source:onr_v1_059_self-modifying-code"),
        expect.stringContaining("tactics:setup.program_search"),
      ]),
    );
  });

  it("rejects pure economy events as breaker-coverage search matches", () => {
    const action = legalAction(
      "play-livewire",
      "runner",
      "play_event",
      {},
      {
        source: "onr_v1_097_livewires-contacts",
        label: "Livewire's Contacts",
      },
    );
    const plan = coverageSearchPlan("breaker_wall");
    const candidate: ActionSemanticCandidate = {
      ...candidateForAction(action),
      sourceKind: "card",
      sourceCardId: "onr_v1_097_livewires-contacts",
      semanticActionType: "play.runner_event",
      actionTacticSignals: ["recover_economy"],
      evidence: ["candidate carries burst economy semantics"],
    };
    const input = aiInput("runner", [action]);
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_097_livewires-contacts", "runner", "event", {
        rulesText: "Gain 3 credits.",
      }),
    ];

    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      [candidate],
      input,
    );

    expect(mapping.status).toBe("blocked_missing_capability");
    expect(mapping.actionCandidateIds).toEqual([]);
    expect(mapping.rationale.join("\n")).toContain(
      "why_livewire_not_search:economy_does_not_satisfy_coverage",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "blocked_no_valid_search_action",
    );
  });

  it("still maps Livewire's Contacts to credit blockers outside coverage search", () => {
    const action = legalAction(
      "play-livewire",
      "runner",
      "play_event",
      {},
      {
        source: "onr_v1_097_livewires-contacts",
        label: "Livewire's Contacts",
      },
    );
    const plan = createTacticalPlan({
      planId: "runner.build_credit_base",
      side: "runner",
      type: "runner.build_credit_base",
      status: "active",
      priority: 800,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "gain_credits:runner_credit_base",
        kind: "gain_credits",
        desiredActionSemantics: ["play.runner_event", "recover_economy"],
        requiredCapabilities: [
          {
            capabilityId: "credits:runner",
            kind: "credits",
            side: "runner",
            evidence: ["credit blocker needs funding"],
          },
        ],
      }),
      requiredCapabilities: [
        {
          capabilityId: "credits:runner",
          kind: "credits",
          side: "runner",
          evidence: ["credit blocker needs funding"],
        },
      ],
      stateVersion: 1,
    });
    const candidate: ActionSemanticCandidate = {
      ...candidateForAction(action),
      sourceKind: "card",
      sourceCardId: "onr_v1_097_livewires-contacts",
      semanticActionType: "play.runner_event",
      actionTacticSignals: ["recover_economy"],
      evidence: ["candidate carries burst economy semantics"],
    };
    const input = aiInput("runner", [action]);

    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      [candidate],
      input,
    );

    expect(mapping.status).toBe("matched");
    expect(mapping.actionCandidateIds).toEqual(["play-livewire"]);
    expect(mapping.legalActions[0]).toBe(input.legalActions[0]);
    expect(mapping.rationale.join("\n")).not.toContain(
      "blocked_no_valid_search_action",
    );
  });

  it("rejects Junkyard BBS recovery when the top heap card does not fit coverage", () => {
    const action = legalAction(
      "junkyard-livewire",
      "runner",
      "activated_card_ability",
      {
        targetCardDefinitionId: "onr_v1_097_livewires-contacts",
      },
      {
        source: "junkyard-1",
        label: "Junkyard BBS: return top heap card",
      },
    );
    const plan = coverageSearchPlan("breaker_wall");
    const candidate: ActionSemanticCandidate = {
      ...candidateForAction(action),
      sourceKind: "card",
      sourceCardId: "onr_v1_165_junkyard-bbs",
      semanticActionType: "card_ability.trigger",
      actionTacticSignals: ["setup.recovery", "trash_recovery"],
      evidence: ["candidate carries top trash recovery semantics"],
    };
    const input = aiInput("runner", [action]);
    input.playerView.own.rig = [
      visibleCard("junkyard-1", "runner", "resource"),
    ];

    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      [candidate],
      input,
    );

    expect(mapping.status).toBe("blocked_missing_capability");
    expect(mapping.actionCandidateIds).toEqual([]);
    expect(mapping.rationale.join("\n")).toContain(
      "recoveryTargetEvaluation:onr_v1_097_livewires-contacts:low",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "why_junkyard_recovery_allowed_or_rejected:rejected_no_plan_fit",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "repeatedRecoverySameCardPenalty:80",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "repeatedEconomyRecoveryLoopPenalty:220",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "noProgressOnRequiredCapabilityPenalty:180",
    );
  });

  it("reduces Junkyard economy recovery loop penalty when credits are genuinely short", () => {
    const action = legalAction(
      "junkyard-livewire-funded",
      "runner",
      "activated_card_ability",
      {
        targetCardDefinitionId: "onr_v1_097_livewires-contacts",
      },
      {
        source: "junkyard-1",
        label: "Junkyard BBS: return top heap card",
      },
    );
    const plan = coverageSearchPlan("breaker_wall");
    const candidate: ActionSemanticCandidate = {
      ...candidateForAction(action),
      sourceKind: "card",
      sourceCardId: "onr_v1_165_junkyard-bbs",
      semanticActionType: "card_ability.trigger",
      actionTacticSignals: ["setup.recovery", "trash_recovery"],
      evidence: ["candidate carries top trash recovery semantics"],
    };
    const input = aiInput("runner", [action]);
    input.playerView.own.credits = 1;
    input.playerView.own.rig = [
      visibleCard("junkyard-1", "runner", "resource"),
    ];

    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      [candidate],
      input,
    );

    expect(mapping.status).toBe("blocked_missing_capability");
    expect(mapping.actionCandidateIds).toEqual([]);
    expect(mapping.rationale.join("\n")).toContain(
      "fundingNeedReducesRecoveryLoopPenalty:true",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "repeatedRecoverySameCardPenalty:20",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "repeatedEconomyRecoveryLoopPenalty:60",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "noProgressOnRequiredCapabilityPenalty:90",
    );
  });

  it("allows Junkyard BBS recovery when the recovered card fits coverage", () => {
    const action = legalAction(
      "junkyard-fracter",
      "runner",
      "activated_card_ability",
      {
        targetCardDefinitionId: "simple_fracter",
      },
      {
        source: "junkyard-1",
        label: "Junkyard BBS: return top heap card",
      },
    );
    const plan = coverageSearchPlan("breaker_wall");
    const candidate: ActionSemanticCandidate = {
      ...candidateForAction(action),
      sourceKind: "card",
      sourceCardId: "onr_v1_165_junkyard-bbs",
      semanticActionType: "card_ability.trigger",
      actionTacticSignals: ["setup.recovery", "trash_recovery"],
      evidence: ["candidate carries top trash recovery semantics"],
    };
    const input = aiInput("runner", [action]);
    input.playerView.own.rig = [
      visibleCard("junkyard-1", "runner", "resource"),
    ];

    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      [candidate],
      input,
    );

    expect(mapping.status).toBe("matched");
    expect(mapping.actionCandidateIds).toEqual(["junkyard-fracter"]);
    expect(mapping.rationale.join("\n")).toContain(
      "source:onr_v1_165_junkyard-bbs",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "repeatedRecoverySameCardPenalty:0",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "repeatedEconomyRecoveryLoopPenalty:0",
    );
  });

  it("maps bank steps from candidate bank semantics without label hints", () => {
    const action = legalAction(
      "use-bank",
      "runner",
      "trigger_ability",
      {},
      {
        source: "broker-1",
        label: "Use ability",
      },
    );
    const plan = createTacticalPlan({
      planId: "runner.cash_out_credit_bank",
      side: "runner",
      type: "runner.cash_out_credit_bank",
      status: "active",
      priority: 800,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "cash_out_bank:runner",
        kind: "cash_out_bank",
        desiredActionSemantics: [],
        rationale: ["fund active plan"],
      }),
      stateVersion: 1,
    });
    const candidate: ActionSemanticCandidate = {
      ...candidateForAction(action),
      sourceKind: "card",
      sourceCardId: "onr_v1_154_broker",
      semanticActionType: "economy.temporary_resource_bank",
      actionTacticSignals: ["cash_out_credit_bank", "payout"],
      evidence: ["candidate carries temporary_resource_bank semantics"],
    };

    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      [candidate],
      aiInput("runner", [action]),
    );

    expect(mapping.status).toBe("matched");
    expect(mapping.actionCandidateIds).toEqual(["use-bank"]);
  });

  it("derives missing wall breaker coverage from visible rezzed ICE", () => {
    const input = aiInput("runner", [
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction("draw", "runner", "draw_card"),
    ]);
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("simple_barrier_ice", "corp", "ice", {
            rezzed: true,
            subtypes: ["Wall"],
          }),
        ],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];

    const plans = buildTacticalPlans({ input });
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");

    expect(coveragePlan?.requiredCapabilities[0]?.kind).toBe("breaker_wall");
    expect(coveragePlan?.currentStep.rationale[0]).toContain("breaker_wall");
  });

  it("derives missing code-gate coverage from the actual blocked ICE", () => {
    const input = aiInput("runner", [
      legalAction("run-rd", "runner", "start_run", {
        serverId: "rd",
      }),
      legalAction("draw", "runner", "draw_card"),
    ]);
    input.playerView.own.rig = [
      visibleCard("efficient_fracter", "runner", "program", {
        subtypes: ["Fracter"],
        rulesText: "1 credit: Break 1 barrier subroutine.",
        strength: 3,
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("simple_code_gate_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["code_gate"],
          strength: 2,
        }),
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["barrier"],
          strength: 3,
        }),
      ]),
      server("archives"),
    ];

    const plans = buildTacticalPlans({ input });
    const coveragePlan = runnerCoverageTargetPlan(plans, "rd");

    expect(coveragePlan?.requiredCapabilities[0]?.kind).toBe(
      "breaker_code_gate",
    );
    expect(coveragePlan?.currentStep.requiredCapabilities[0]?.kind).toBe(
      "breaker_code_gate",
    );
    expect(coveragePlan?.currentStep.rationale.join("\n")).toContain(
      "breaker_code_gate",
    );
  });

  it("adds deck capability evidence when a missing breaker can be searched", () => {
    const input = aiInput("runner", [
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction(
        "smc-search",
        "runner",
        "trigger_ability",
        {},
        {
          source: "onr_v1_059_self-modifying-code",
          label: "Self-Modifying Code: search your stack for a program",
        },
      ),
    ]);
    input.playerView.own.rig = [
      visibleCard("onr_v1_059_self-modifying-code", "runner", "program"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("simple_barrier_ice", "corp", "ice", {
            rezzed: true,
            subtypes: ["Wall"],
          }),
        ],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];
    const deckCapabilities = buildDeckCapabilityProfile({
      side: "runner",
      playerView: input.playerView,
      legalActions: input.legalActions,
      deckSnapshot: {
        deckSnapshotId: "tactical-plan-deck-capability-test",
        side: "runner",
        cards: [
          { cardId: "onr_v1_021_dwarf", quantity: 1 },
          { cardId: "onr_v1_059_self-modifying-code", quantity: 1 },
        ],
      },
    });

    const plans = buildTacticalPlans({ input, deckCapabilities });
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");

    expect(coveragePlan?.evidence).toEqual(
      expect.arrayContaining([
        "deck_capability:breaker_wall=in_deck/searchable",
      ]),
    );
    expect(
      coveragePlan?.blockers.some(
        (blocker) => blocker.kind === "coverage_not_in_deck",
      ),
    ).toBe(false);
  });

  it("adds granular blockers when deck capabilities have no matching coverage", () => {
    const input = aiInput("runner", [
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction("draw", "runner", "draw_card"),
    ]);
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("simple_barrier_ice", "corp", "ice", {
            rezzed: true,
            subtypes: ["Wall"],
          }),
        ],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];
    const deckCapabilities = buildDeckCapabilityProfile({
      side: "runner",
      playerView: input.playerView,
      legalActions: input.legalActions,
      deckSnapshot: {
        deckSnapshotId: "tactical-plan-missing-wall-test",
        side: "runner",
        cards: [{ cardId: "onr_v1_014_codecracker", quantity: 1 }],
      },
    });

    const plans = buildTacticalPlans({ input, deckCapabilities });
    const contestPlan = plans.find(
      (plan) => plan.planId === "runner.contest_remote:remote_1",
    );
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");

    expect(contestPlan?.blockers.map((blocker) => blocker.kind)).toEqual(
      expect.arrayContaining([
        "missing_breaker_coverage",
        "missing_wall_coverage",
        "coverage_not_in_deck",
      ]),
    );
    expect(coveragePlan?.currentStep.kind).toBe("pivot_to_alternative");
    expect(coveragePlan?.status).toBe("blocked");
    expect(coveragePlan?.currentStep.rationale).toEqual(
      expect.arrayContaining(["deck_capability:coverage_not_in_deck"]),
    );
  });

  it("draws for known deck coverage when no search access is legal", () => {
    const input = aiInput("runner", [
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction("draw", "runner", "draw_card"),
    ]);
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("simple_barrier_ice", "corp", "ice", {
            rezzed: true,
            subtypes: ["Wall"],
          }),
        ],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];
    const deckCapabilities = buildDeckCapabilityProfile({
      side: "runner",
      playerView: input.playerView,
      legalActions: input.legalActions,
      deckSnapshot: {
        deckSnapshotId: "tactical-plan-draw-only-wall-test",
        side: "runner",
        cards: [{ cardId: "onr_v1_021_dwarf", quantity: 1 }],
      },
    });

    const plans = buildTacticalPlans({ input, deckCapabilities });
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");

    expect(coveragePlan?.currentStep.kind).toBe("draw_for_answer");
    expect(coveragePlan?.currentStep.rationale).toEqual(
      expect.arrayContaining(["deck_capability:draw_only"]),
    );
  });

  it("maps legal Mantis program search before draw fallbacks for missing wall coverage", () => {
    const input = wallCoverageInput([
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction(
        "mantis",
        "runner",
        "play_event",
        {},
        {
          source: "mantis-card",
          label: "Mantis, Fixer-at-Large spielen",
        },
      ),
      legalAction(
        "bodyweight",
        "runner",
        "play_event",
        {},
        {
          source: "bodyweight-card",
          label: "Bodyweight Synthetic Blood spielen",
        },
      ),
      legalAction("draw", "runner", "draw_card"),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("mantis-card", "runner", "event", {
        definitionId: "onr_v1_099_mantis-fixer-at-large",
        title: "Mantis, Fixer-at-Large",
        rulesText:
          "Search your stack for a program, reveal it and bring it into your grip. Shuffle your stack afterwards.",
      }),
      visibleCard("bodyweight-card", "runner", "event", {
        definitionId: "onr_v1_079_bodyweight-synthetic-blood",
        title: "Bodyweight Synthetic Blood",
        rulesText: "Draw five cards.",
      }),
    ];

    const plans = buildTacticalPlans({ input });
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");
    const mapping = mapPlanStepToLegalActions(
      coveragePlan!,
      coveragePlan!.currentStep,
      input.legalActions.map(candidateForUntargetedAction),
      input,
    );

    expect(coveragePlan?.currentStep.kind).toBe("search_for_answer");
    expect(coveragePlan?.currentStep.rationale).toEqual(
      expect.arrayContaining(["coverage_answer_role:program_search"]),
    );
    expect(mapping.actionCandidateIds).toEqual(["mantis"]);
    expect(mapping.rationale.join("\n")).toContain(
      "coverageAnswerRole:program_search",
    );
  });

  it("uses search-engine setup before basic draw when The Short Circuit is installable", () => {
    const input = wallCoverageInput([
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction(
        "install-short-circuit",
        "runner",
        "install_card",
        {},
        {
          source: "short-circuit-card",
          label: "The Short Circuit installieren",
        },
      ),
      legalAction("draw", "runner", "draw_card"),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("short-circuit-card", "runner", "resource", {
        definitionId: "onr_v1_177_the-short-circuit",
        title: "The Short Circuit",
        rulesText:
          "[A], [1]: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.",
      }),
    ];

    const plans = buildTacticalPlans({ input });
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");
    const mapping = mapPlanStepToLegalActions(
      coveragePlan!,
      coveragePlan!.currentStep,
      input.legalActions.map(candidateForUntargetedAction),
      input,
    );

    expect(coveragePlan?.currentStep.kind).toBe("setup_search_engine");
    expect(coveragePlan?.currentStep.rationale).toEqual(
      expect.arrayContaining(["coverage_answer_role:search_engine_setup"]),
    );
    expect(mapping.actionCandidateIds).toEqual(["install-short-circuit"]);
    expect(mapping.rationale.join("\n")).toContain(
      "coverageAnswerRole:search_engine_setup",
    );
  });

  it("blocks repeated The Short Circuit searches while the fetched program waits in hand", () => {
    const searchAction = legalAction(
      "short-circuit-search",
      "runner",
      "activated_card_ability",
      {},
      {
        source: "short-circuit",
        label: "The Short Circuit: Stack nach Programm durchsuchen",
      },
    );
    const input = wallCoverageInput([
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      searchAction,
      legalAction("gain", "runner", "gain_credit"),
    ]);
    input.playerView.own.rig = [
      visibleCard("short-circuit", "runner", "resource", {
        definitionId: "onr_v1_177_the-short-circuit",
        title: "The Short Circuit",
        rulesText: "Search your stack for a program.",
      }),
    ];
    input.playerView.own.gripOrHq = [
      visibleCard("pile-driver", "runner", "program", {
        definitionId: "onr_v1_047_pile-driver",
        title: "Pile Driver",
      }),
    ];
    input.playerView.publicEvents = [
      publicEvent(
        "previous-short-circuit-search",
        74,
        "activated_card_ability",
        {
          actor: "runner",
          actionType: "activated_card_ability",
          hiddenZoneAction: "p3_37_search_stack_to_grip",
        },
      ),
    ];
    input.eventTail = input.playerView.publicEvents;

    const coveragePlan = coverageSearchPlan("breaker_wall");
    const mapping = mapPlanStepToLegalActions(
      coveragePlan,
      coveragePlan.currentStep,
      [
        {
          ...candidateForAction(searchAction),
          sourceKind: "card",
          sourceCardId: "onr_v1_177_the-short-circuit",
          semanticActionType: "card_ability.trigger",
          actionTacticSignals: ["setup.program_search", "program_search"],
        },
      ],
      input,
    );

    expect(mapping.status).toBe("blocked_missing_capability");
    expect(mapping.actionCandidateIds).toEqual([]);
    expect(mapping.rationale.join("\n")).toContain(
      "rejectedFalseMatches:coverage_search_wait_for_install_or_fund",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "blocked_no_valid_search_action",
    );
  });

  it("uses Bodyweight draw-for-answer before basic draw when no better search is legal", () => {
    const input = wallCoverageInput([
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction(
        "bodyweight",
        "runner",
        "play_event",
        {},
        {
          source: "bodyweight-card",
          label: "Bodyweight Synthetic Blood spielen",
        },
      ),
      legalAction("draw", "runner", "draw_card"),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("bodyweight-card", "runner", "event", {
        definitionId: "onr_v1_079_bodyweight-synthetic-blood",
        title: "Bodyweight Synthetic Blood",
        rulesText: "Draw five cards.",
      }),
    ];

    const plans = buildTacticalPlans({ input });
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");
    const mapping = mapPlanStepToLegalActions(
      coveragePlan!,
      coveragePlan!.currentStep,
      input.legalActions.map(candidateForUntargetedAction),
      input,
    );

    expect(coveragePlan?.currentStep.kind).toBe("draw_for_answer");
    expect(mapping.actionCandidateIds).toEqual(["bodyweight", "draw"]);
    expect(mapping.rationale.join("\n")).toContain(
      "coverageAnswerRole:draw_for_answer",
    );
    expect(mapping.rationale.join("\n")).toContain(
      "coverageAnswerRole:basic_draw_fallback",
    );
  });

  it("uses basic draw as draw-for-answer fallback when no search or draw card is legal", () => {
    const input = wallCoverageInput([
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction("draw", "runner", "draw_card"),
    ]);

    const plans = buildTacticalPlans({ input });
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");
    const mapping = mapPlanStepToLegalActions(
      coveragePlan!,
      coveragePlan!.currentStep,
      input.legalActions.map(candidateForUntargetedAction),
      input,
    );

    expect(coveragePlan?.currentStep.kind).toBe("draw_for_answer");
    expect(coveragePlan?.currentStep.rationale).toEqual(
      expect.arrayContaining(["coverage_answer_role:basic_draw_fallback"]),
    );
    expect(mapping.actionCandidateIds).toEqual(["draw"]);
    expect(mapping.rationale.join("\n")).toContain(
      "coverageAnswerRole:basic_draw_fallback",
    );
  });

  it("resolves missing MU before trying to install a breaker in hand", () => {
    const input = aiInput("runner", [
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction("gain", "runner", "gain_credit"),
    ]);
    input.playerView.own.memoryUsed = 4;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.rig = [];
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["icebreaker", "worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("simple_barrier_ice", "corp", "ice", {
            rezzed: true,
            subtypes: ["Wall"],
          }),
        ],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];
    const deckCapabilities = buildDeckCapabilityProfile({
      side: "runner",
      playerView: input.playerView,
      legalActions: input.legalActions,
      deckSnapshot: {
        deckSnapshotId: "tactical-plan-missing-mu-test",
        side: "runner",
        cards: [{ cardId: "onr_v1_021_dwarf", quantity: 1 }],
      },
    });

    const plans = buildTacticalPlans({ input, deckCapabilities });
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");
    const contestPlan = plans.find(
      (plan) => plan.planId === "runner.contest_remote:remote_1",
    );

    expect(coveragePlan?.currentStep.kind).toBe("resolve_missing_mu");
    expect(contestPlan?.blockers.map((blocker) => blocker.kind)).toEqual(
      expect.arrayContaining(["breaker_present_but_mu_blocked", "missing_mu"]),
    );
  });

  it("keeps central pressure as the target plan when breaker coverage is needed", () => {
    const input = aiInput("runner", [
      legalAction("run-rd", "runner", "start_run", {
        serverId: "rd",
      }),
      legalAction("draw", "runner", "draw_card"),
    ]);
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ]),
      server("archives"),
    ];

    const plans = buildTacticalPlans({ input });
    const centralPlan = plans.find(
      (plan) => plan.planId === "runner.opportunistic_central_run:rd",
    );
    const coveragePlan = runnerCoverageTargetPlan(plans, "rd");

    expect(coveragePlan).toBe(centralPlan);
    expect(centralPlan?.status).toBe("active");
    expect(centralPlan?.blockers[0]).toMatchObject({
      kind: "missing_breaker_coverage",
      target: { kind: "server", id: "rd" },
    });
    expect(centralPlan?.currentStep.kind).toBe("draw_for_answer");
    expect(coveragePlan?.status).toBe("active");
    expect(coveragePlan?.requiredCapabilities[0]?.kind).toBe("breaker_wall");
  });

  it("abandons an R&D probe when the known top card is stale and low-value", () => {
    const input = aiInput("runner", [
      legalAction("run-rd", "runner", "start_run", {
        serverId: "rd",
      }),
      legalAction("run-hq", "runner", "start_run", {
        serverId: "hq",
      }),
      legalAction("gain", "runner", "gain_credit"),
    ]);
    input.playerView.stateVersion = 3;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.eventTail = [
      rdAccessEvent("tactical-rd-rock-access", 1, "onr_v1_265_rock-is-strong"),
    ];

    const plans = buildTacticalPlans({ input });
    const rdPlan = plans.find(
      (plan) => plan.planId === "runner.opportunistic_central_run:rd",
    );
    const hqPlan = plans.find(
      (plan) => plan.planId === "runner.opportunistic_central_run:hq",
    );

    expect(rdPlan?.status).toBe("abandoned");
    expect(rdPlan?.blockers.map((blocker) => blocker.kind)).toEqual([
      "target_unreachable",
    ]);
    expect(rdPlan?.evidence).toEqual(
      expect.arrayContaining([
        "known_rnd_top_low_value_stale",
        "central_known_no_current_payoff",
        "rd_run_suppressed_by_known_low_value_top:true",
        "central_memory_payoff:known_low_value",
      ]),
    );
    expect(rdPlan?.scoreBreakdown[0]).toMatchObject({
      key: "central_known_no_current_payoff",
      value: -640,
    });
    expect(hqPlan?.status).toBe("active");
  });

  it("abandons an HQ probe when all HQ cards are known and low-value", () => {
    const input = aiInput("runner", [
      legalAction("run-hq", "runner", "start_run", {
        serverId: "hq",
      }),
      legalAction("run-rd", "runner", "start_run", {
        serverId: "rd",
      }),
      legalAction("gain", "runner", "gain_credit"),
    ]);
    input.playerView.stateVersion = 3;
    input.playerView.opponent.handCount = 2;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.eventTail = [
      hqPrivateLookEvent("tactical-hq-known-ice-look", 1, [
        "onr_v1_230_cortical-scanner",
        "onr_v1_237_data-wall",
      ]),
    ];

    const plans = buildTacticalPlans({ input });
    const hqPlan = plans.find(
      (plan) => plan.planId === "runner.opportunistic_central_run:hq",
    );
    const rdPlan = plans.find(
      (plan) => plan.planId === "runner.opportunistic_central_run:rd",
    );

    expect(hqPlan?.status).toBe("abandoned");
    expect(hqPlan?.blockers.map((blocker) => blocker.kind)).toEqual([
      "target_unreachable",
    ]);
    expect(hqPlan?.evidence).toEqual(
      expect.arrayContaining([
        "known_hq_hand_low_value",
        "central_known_no_current_payoff",
        "hq_run_suppressed_by_fully_known_low_value_hand:true",
        "central_memory_payoff:known_low_value",
      ]),
    );
    expect(hqPlan?.scoreBreakdown[0]).toMatchObject({
      key: "central_known_no_current_payoff",
      value: -640,
    });
    expect(rdPlan?.status).toBe("active");
  });

  it("abandons a repeated HQ probe after the only current HQ card was accessed", () => {
    const input = aiInput("runner", [
      legalAction("run-hq", "runner", "start_run", {
        serverId: "hq",
      }),
      legalAction("run-rd", "runner", "start_run", {
        serverId: "rd",
      }),
      legalAction("gain", "runner", "gain_credit"),
    ]);
    input.playerView.stateVersion = 4;
    input.playerView.opponent.handCount = 1;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.eventTail = [
      hqPrivateLookEvent("tactical-hq-stale-root-look", 1, [
        "simple_economy_asset",
        "simple_upgrade",
      ]),
      publicEvent("tactical-hq-hidden-root-install", 2, "install_card", {
        actor: "corp",
        actionType: "install_card",
        serverId: "remote_1",
        installPlacement: "root",
      }),
      publicEvent("tactical-hq-current-operation-access", 3, "access_card", {
        actor: "runner",
        actionType: "access_card",
        serverLabel: "HQ",
        cardDefinitionId: "onr_v1_297_overtime-incentives",
        title: "Overtime Incentives",
      }),
    ];

    const plans = buildTacticalPlans({ input });
    const hqPlan = plans.find(
      (plan) => plan.planId === "runner.opportunistic_central_run:hq",
    );
    const rdPlan = plans.find(
      (plan) => plan.planId === "runner.opportunistic_central_run:rd",
    );

    expect(hqPlan?.status).toBe("abandoned");
    expect(hqPlan?.evidence).toEqual(
      expect.arrayContaining([
        "known_hq_hand_low_value",
        "central_known_no_current_payoff",
        "hq_run_suppressed_by_fully_known_low_value_hand:true",
        "central_memory_payoff:known_low_value",
      ]),
    );
    expect(hqPlan?.scoreBreakdown[0]).toMatchObject({
      key: "central_known_no_current_payoff",
      value: -640,
    });
    expect(rdPlan?.status).toBe("active");
  });

  it("funds an unaffordable matching breaker in hand instead of drawing", () => {
    const input = aiInput("runner", [
      legalAction("run-rd", "runner", "start_run", {
        serverId: "rd",
      }),
      legalAction("draw", "runner", "draw_card"),
      legalAction("gain", "runner", "gain_credit"),
    ]);
    input.playerView.own.credits = 1;
    input.playerView.own.rig = [];
    input.playerView.own.gripOrHq = [
      visibleCard("expensive_fracter", "runner", "program", {
        installCost: 6,
        subtypes: ["Fracter"],
        rulesText: "1 credit: Break 1 barrier subroutine.",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ]),
      server("archives"),
    ];

    const plans = buildTacticalPlans({ input });
    const coveragePlan = runnerCoverageTargetPlan(plans, "rd");
    const centralPlan = plans.find(
      (plan) => plan.planId === "runner.opportunistic_central_run:rd",
    );

    expect(coveragePlan?.currentStep.kind).toBe("gain_credits");
    expect(coveragePlan?.currentStep.rationale).toEqual(
      expect.arrayContaining([
        expect.stringContaining("breaker is already in hand"),
      ]),
    );
    expect(centralPlan?.blockers[0]?.removalStepKind).toBe("gain_credits");
  });

  it("does not create an active contest plan for an empty remote shell", () => {
    const input = aiInput("runner", [
      legalAction("run-remote-2", "runner", "start_run", {
        serverId: "remote_2",
      }),
      legalAction("gain", "runner", "gain_credit"),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_2", [
        visibleCard("remote-2-ice", "corp", "ice", {
          rezzed: false,
        }),
      ]),
    ];

    const plans = buildTacticalPlans({ input });
    const emptyRemotePlan = plans.find(
      (plan) => plan.planId === "runner.contest_remote:remote_2",
    );

    expect(emptyRemotePlan?.status).toBe("abandoned");
    expect(emptyRemotePlan?.scoreBreakdown[0]).toMatchObject({
      key: "empty_remote_no_root_value",
    });
  });

  it("uses structured access commitment and outcome memory for no-payoff remote plans", () => {
    const input = aiInput("runner", [
      legalAction("run-remote-2", "runner", "start_run", {
        serverId: "remote_2",
      }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_2",
        [],
        [
          visibleCard("spent-event", "corp", "event", {
            definitionId: "spent-event",
          }),
        ],
      ),
    ];

    const result = evaluateTacticalPlans({
      input,
      accessCommitment: {
        serverId: "remote_2",
        knownAccessState: "known_no_current_payoff",
        intendedAccessAction: "decline",
        reason: "low_value_target",
        evidence: ["test_structured_access_commitment"],
      },
      accessOutcomeMemory: {
        applies: true,
        suppressesPlanBonus: true,
        evidence: ["test_structured_access_outcome_memory"],
      },
    });
    const remotePlan = result.planAlternatives.find(
      (plan) => plan.planId === "runner.contest_remote:remote_2",
    );

    expect(remotePlan?.status).toBe("abandoned");
    expect(remotePlan?.evidence).toEqual(
      expect.arrayContaining([
        "structured_access_commitment_server:remote_2",
        "structured_access_commitment_state:known_no_current_payoff",
        "access_outcome_memory_no_plan_bonus:true",
        "access_outcome_memory_applied:declined_access",
      ]),
    );
    expect(remotePlan?.evidence.join("\n")).not.toContain(
      "remote_access_outcome_memory_applied:declined_trash",
    );
    expect(result.accessCommitmentUsed).toEqual(
      expect.arrayContaining([
        "access_commitment_server:remote_2",
        "access_commitment_intended_action:decline",
      ]),
    );
    expect(result.accessOutcomeMemoryUsed).toEqual(
      expect.arrayContaining([
        "access_outcome_memory_applies:true",
        "access_outcome_memory_suppresses_plan_bonus:true",
      ]),
    );
  });

  it("does not continue a previous no-progress remote plan over central pressure", () => {
    const noProgressRemoteEvents = [
      publicEvent("evt-run-remote-1", 8, "start_run", {
        actor: "runner",
        actionType: "start_run",
        serverId: "remote_1",
      }),
      publicEvent("evt-access-remote-1", 9, "access_card", {
        actor: "runner",
        actionType: "access_card",
        serverId: "remote_1",
        cardDefinitionId: "onr_v1_317_data-masons",
        accessedCardPositionKey: "root:0",
        accessedArea: "root",
      }),
    ];
    const input = aiInput("runner", [
      legalAction("run-remote-1", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction("run-rd", "runner", "start_run", {
        serverId: "rd",
      }),
    ]);
    input.playerView.stateVersion = 10;
    input.playerView.publicEvents = noProgressRemoteEvents;
    input.eventTail = noProgressRemoteEvents;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [],
        [
          visibleCard("remote-root", "corp", "asset", {
            definitionId: "onr_v1_317_data-masons",
            trashCost: 1,
          }),
        ],
      ),
    ];
    const runnerRunTargetEvaluations = evaluateRunnerRunTargets({ input });

    const result = evaluateTacticalPlans({
      input,
      previousPlan: {
        schemaVersion: "tactical-plan-v1",
        memoryId: "previous-remote-1",
        side: "runner",
        planId: "runner.contest_remote:remote_1",
        type: "runner.contest_remote",
        status: "progressing",
        target: { kind: "server", id: "remote_1" },
        selectedStepKind: "run_target",
        selectedActionId: "run-remote-1",
        blockedBy: [],
        ttlDecisionsRemaining: 2,
        planProgressionReason: "previous_plan_considered",
        updatedAtStateVersion: 9,
      },
      runnerRunTargetEvaluations,
    });
    const remotePlan = result.planAlternatives.find(
      (plan) => plan.planId === "runner.contest_remote:remote_1",
    );

    expect(result.planAlternatives[0]?.planId).toBe(
      "runner.opportunistic_central_run:rd",
    );
    expect(remotePlan?.evidence).toEqual(
      expect.arrayContaining([
        "repeated_remote_no_progress_suppressed",
        "known_remote_no_current_payoff",
      ]),
    );
    expect(remotePlan?.priority).toBeLessThan(
      result.planAlternatives[0]?.priority ?? -Infinity,
    );
  });

  it("explains normal remote run priority with run-target score components", () => {
    const remoteRun = legalAction("run-remote-2", "runner", "start_run", {
      serverId: "remote_2",
    });
    const input = aiInput("runner", [remoteRun]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_2",
        [],
        [
          visibleCard("onr_v1_317_data-masons", "corp", "asset", {
            trashCost: 1,
          }),
        ],
      ),
    ];
    const runnerRunTargetEvaluations: RunnerRunTargetEvaluation[] = [
      {
        schemaVersion: "runner-run-target-evaluation-v1",
        targetServerId: "remote_2",
        targetKind: "remote",
        accessServerId: "remote_2",
        accessTargetKind: "remote",
        actionId: remoteRun.actionId,
        accessPayoff: "trash_affordable",
        knownAccessState: "known_payoff",
        multiaccessAvailable: false,
        pathPassability: "reachable",
        pathCost: 0,
        creditsAfterRun: 5,
        stealOrTrashAffordable: true,
        installedRunPayoff: {
          immediateAccessValue: 0,
          futureSetupValue: 0,
          purgeTaxValue: 0,
          economyValue: 0,
          riskPenalty: 0,
          scoreBonus: 0,
          multiaccessAvailable: false,
          evidence: [],
        },
        runActionPayoff: {
          immediateAccessValue: 0,
          futureSetupValue: 0,
          purgeTaxValue: 0,
          economyValue: 0,
          riskPenalty: 0,
          scoreBonus: 0,
          multiaccessAvailable: false,
          evidence: [],
        },
        runActionProjection: {
          actionId: remoteRun.actionId,
          actionType: "start_run",
          sourceKind: "basic_action",
          targetServerId: "remote_2",
          targetKind: "remote",
          structure: "direct_start_run",
          accessPayoffSignals: [],
          constraintSignals: [],
          riskSignals: [],
          noNoisyBreakers: false,
          bypassFirstIce: false,
          projectionStatus: "concrete_target",
          evidence: ["run_action_projection:side_safe"],
        },
        riskyUniversalCoverage: false,
        scoreThreat: false,
        recommendation: "run_now",
        score: 480,
        evidence: ["test_known_trashable_remote"],
      },
    ];

    const plans = buildTacticalPlans({
      input,
      runnerRunTargetEvaluations,
    });
    const remotePlan = plans.find(
      (plan) => plan.planId === "runner.contest_remote:remote_2",
    );

    expect(remotePlan?.priority).toBe(1000);
    expect(remotePlan?.scoreBreakdown).toEqual([
      {
        key: "runner_run_target_base",
        label: "Remote-Run-Basis",
        value: 820,
        reason: "remote_2",
      },
      {
        key: "runner_run_target_recommendation",
        label: "RunTarget-Empfehlung",
        value: 180,
        reason: "run_now;payoff:trash_affordable;score:480",
      },
    ]);
  });

  it("uses neutral remote score-threat goals as remote-contest anchors", () => {
    const remoteRun = legalAction("run-remote-2", "runner", "start_run", {
      serverId: "remote_2",
    });
    const input = aiInput("runner", [remoteRun]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_2",
        [],
        [
          {
            instanceId: "advanced-remote-root",
            definitionId: "advanced-remote-root",
            title: "Advanced remote root",
            owner: "corp",
            controller: "corp",
            type: "agenda",
            known: false,
            advancementCounters: 2,
          } as VisibleCard,
        ],
      ),
    ];

    const plans = buildTacticalPlans({
      input,
      tacticalGoals: [
        {
          goalId: "runner.neutral.remote_contest_if_score_threat",
          family: "remote_contest",
          priority: 820,
          urgency: "high",
          targetServerId: "remote_2",
          source: "neutral",
          evidence: [
            "neutral_goal:remote_contest",
            "run_target:remote_score_threat",
          ],
        },
      ],
    });
    const remotePlan = plans.find(
      (plan) => plan.planId === "runner.contest_remote:remote_2",
    );

    expect(remotePlan?.priority).toBe(927);
    expect(remotePlan?.evidence).toEqual(
      expect.arrayContaining([
        "strategic_plan_goal:runner.neutral.remote_contest_if_score_threat",
        "neutral_goal:remote_contest",
        "run_target:remote_score_threat",
      ]),
    );
    expect(remotePlan?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        {
          key: "strategic_tactical_goal_fit",
          label: "Strategic goal fit",
          value: 107,
          reason: "runner.neutral.remote_contest_if_score_threat",
        },
      ]),
    );
  });

  it("uses bank capability evidence for runner cashout plans", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-cash",
        "runner",
        "trigger_ability",
        { cardImplementationTakesHostedCredits: true },
        {
          source: "onr_v1_154_broker",
          label: "Use ability",
        },
      ),
    ]);
    input.playerView.own.credits = 2;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource", {
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 6,
            displayKind: "stored_credits",
            label: "6",
            ariaLabel: "6 gespeicherte Credits",
            usageHint: "spendable",
          },
        ],
      }),
    ];
    const deckCapabilities = buildDeckCapabilityProfile({
      side: "runner",
      playerView: input.playerView,
      legalActions: input.legalActions,
      deckSnapshot: {
        deckSnapshotId: "tactical-plan-runner-bank-test",
        side: "runner",
        cards: [{ cardId: "onr_v1_154_broker", quantity: 1 }],
      },
    });

    const plans = buildTacticalPlans({ input, deckCapabilities });
    const cashoutPlan = plans.find(
      (plan) => plan.type === "runner.cash_out_credit_bank",
    );

    expect(cashoutPlan?.currentStep.requiredCapabilities[0]?.kind).toBe(
      "bank_payout",
    );
    expect(cashoutPlan?.evidence).toEqual(
      expect.arrayContaining([
        "bank_tool_count:1",
        "bank_estimated_payout:6",
        "runner_bank_cashout_reason:urgent_credit_floor",
      ]),
    );
  });

  it("keeps building runner credit banks below the minimum critical payout", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-build",
        "runner",
        "trigger_ability",
        { cardImplementationAddsHostedCredits: true },
        {
          source: "onr_v1_154_broker",
          label: "Use ability",
        },
      ),
      legalAction(
        "broker-cash",
        "runner",
        "trigger_ability",
        { cardImplementationTakesHostedCredits: true },
        {
          source: "onr_v1_154_broker",
          label: "Use ability",
        },
      ),
    ]);
    input.playerView.own.credits = 2;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource", {
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 2,
            displayKind: "stored_credits",
            label: "2",
            ariaLabel: "2 gespeicherte Credits",
            usageHint: "spendable",
          },
        ],
      }),
    ];
    const deckCapabilities = buildDeckCapabilityProfile({
      side: "runner",
      playerView: input.playerView,
      legalActions: input.legalActions,
      deckSnapshot: {
        deckSnapshotId: "tactical-plan-runner-bank-build-floor-test",
        side: "runner",
        cards: [{ cardId: "onr_v1_154_broker", quantity: 1 }],
      },
    });

    const plans = buildTacticalPlans({ input, deckCapabilities });
    const buildPlan = plans.find(
      (plan) => plan.type === "runner.build_credit_bank",
    );

    expect(buildPlan?.evidence).toEqual(
      expect.arrayContaining([
        "bank_build_action:broker-build",
        "runner_bank_current_stored:2",
        "runner_bank_build_target:12",
        "runner_bank_cashout_minimum:3",
        "runner_bank_cashout_deferred_below_minimum:true",
      ]),
    );
    expect(
      plans.some((plan) => plan.type === "runner.cash_out_credit_bank"),
    ).toBe(false);
  });

  it("labels the best hand-card plan with the concrete own hand card title", () => {
    const input = aiInput("runner", [
      legalAction(
        "install-access-card",
        "runner",
        "install_card",
        {},
        {
          source: "access-card",
        },
      ),
    ]);
    const handDevelopmentEvaluations: RunnerHandDevelopmentEvaluation[] = [
      {
        schemaVersion: "runner-hand-development-evaluation-v1",
        cardInstanceId: "access-card",
        definitionId: "access_card_definition",
        title: "Concrete Access Tool",
        cardType: "hardware",
        availability: "legal_now",
        developmentRole: "access_payoff",
        strategicFit: "strong",
        currentNeed: "useful_now",
        priority: 650,
        deferReason: "none",
        legalActionId: "install-access-card",
        evidence: [],
      },
    ];

    const plans = buildTacticalPlans({
      input,
      runnerHandDevelopmentEvaluations: handDevelopmentEvaluations,
    });
    const handPlan = plans.find(
      (plan) => plan.type === "runner.play_best_hand_card",
    );

    expect(handPlan?.target).toMatchObject({
      kind: "card",
      id: "access-card",
      label: "Concrete Access Tool",
    });
    expect(handPlan?.evidence).toContain("hand_development_role:access_payoff");
    expect(handPlan?.evidence).toContain("best_hand_card_plan:true");
  });

  it("does not plan a redundant persistent duplicate as hand development", () => {
    const installDuplicate = legalAction(
      "install-second-risky-breaker",
      "runner",
      "install_card",
      {},
      { source: "second-risky-breaker" },
    );
    const input = aiInput("runner", [installDuplicate]);
    const handDevelopmentEvaluations: RunnerHandDevelopmentEvaluation[] = [
      runnerHandDevelopmentEvaluation({
        cardInstanceId: "second-risky-breaker",
        developmentRole: "breaker_or_rig_piece",
        strategicFit: "strong",
        currentNeed: "useful_now",
        priority: 950,
        legalActionId: installDuplicate.actionId,
        persistentInstallEvaluation: persistentInstallEvaluation({
          actionId: installDuplicate.actionId,
          capabilityDelta: "backup_only",
          duplicateRole: "redundant_duplicate",
          stackabilityClass: "backup_redundancy",
          installedSameDefinitionCount: 1,
          installedSameFunctionalGroupCount: 1,
          finalInstallFit: -1800,
        }),
      }),
    ];

    const plans = buildTacticalPlans({
      input,
      runnerHandDevelopmentEvaluations: handDevelopmentEvaluations,
    });

    expect(
      plans.some(
        (plan) =>
          plan.planId === "runner.play_best_hand_card:second-risky-breaker" ||
          plan.planId === "runner.develop_hand_card:second-risky-breaker",
      ),
    ).toBe(false);
  });

  it("leaves an urgent direct breaker install to the coverage plan", () => {
    const runRemote = legalAction("run-remote", "runner", "start_run", {
      serverId: "remote_1",
    });
    const installBreaker = legalAction(
      "install-fracter",
      "runner",
      "install_card",
      {},
      { source: "fracter-card" },
    );
    const input = wallCoverageInput([runRemote, installBreaker]);
    input.playerView.own.gripOrHq = [
      visibleCard("fracter-card", "runner", "program", {
        title: "Concrete Fracter",
        subtypes: ["Icebreaker", "Fracter"],
      }),
    ];
    const handDevelopmentEvaluations = [
      runnerHandDevelopmentEvaluation({
        cardInstanceId: "fracter-card",
        title: "Concrete Fracter",
        cardType: "program",
        developmentRole: "breaker_or_rig_piece",
        strategicFit: "strong",
        currentNeed: "acute",
        priority: 980,
        legalActionId: installBreaker.actionId,
      }),
    ];

    const plans = buildTacticalPlans({
      input,
      runnerHandDevelopmentEvaluations: handDevelopmentEvaluations,
    });
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");

    expect(coveragePlan?.currentStep.kind).toBe("install_breaker");
    expect(
      plans.some(
        (plan) =>
          plan.planId === "runner.play_best_hand_card:fracter-card" ||
          plan.planId === "runner.develop_hand_card:fracter-card",
      ),
    ).toBe(false);
  });

  it("keeps urgent score-threat draw plausible when one overflow has discard fodder", () => {
    const run = legalAction("run-remote", "runner", "start_run", {
      serverId: "remote_1",
    });
    const draw = legalAction("draw", "runner", "draw_card");
    const input = aiInput("runner", [run, draw]);
    input.playerView.own.gripOrHq = [
      visibleCard("low-a", "runner", "event"),
      visibleCard("low-b", "runner", "event"),
      visibleCard("setup-a", "runner", "program"),
      visibleCard("setup-b", "runner", "program"),
      visibleCard("setup-c", "runner", "hardware"),
    ];
    input.playerView.own.maxHandSize = 5;
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("simple_barrier_ice", "corp", "ice", {
            rezzed: true,
            subtypes: ["Wall"],
            effectiveRunQuote: {
              iceInstanceId: "simple_barrier_ice",
              iceDefinitionId: "simple_barrier_ice",
              effectiveStrength: 1,
              subroutines: [{ id: "etr", type: "end_the_run" }],
            },
          }),
        ],
        [
          visibleCard("simple_agenda", "corp", "agenda", {
            advancementCounters: 1,
          }),
        ],
      ),
    ];
    const handDevelopmentEvaluations = [
      runnerHandDevelopmentEvaluation({
        cardInstanceId: "low-a",
        developmentRole: "duplicate_or_low_value",
        strategicFit: "weak",
        currentNeed: "none",
        priority: 120,
        deferReason: "duplicate",
      }),
    ];

    const plans = buildTacticalPlans({
      input,
      runnerHandDevelopmentEvaluations: handDevelopmentEvaluations,
    });
    const coveragePlan = runnerCoverageTargetPlan(plans, "remote_1");
    if (!coveragePlan) throw new Error("Missing urgent draw coverage plan");
    expect(coveragePlan.currentStep.kind).toBe("draw_for_answer");
    const mapping = mapPlanStepToLegalActions(
      coveragePlan,
      coveragePlan.currentStep,
      [
        candidateForUntargetedAction(draw),
        candidateForActionWithSelectedTargets(run, [
          {
            targetId: "remote_1",
            targetKind: "server",
            targetSide: "corp",
            visibilityScope: "public",
            evidence: ["test"],
          },
        ]),
      ],
      input,
    );

    expect(mapping.status).toBe("matched");
    expect(mapping.legalActions[0]?.actionId).toBe(draw.actionId);
    expect(coveragePlan?.evidence).toEqual(
      expect.arrayContaining([
        "hand_limit_pressure:minor",
        "projected_overflow:1",
        "discard_fodder_count:1",
        "draw_overflow_penalty:0",
        "urgency_override:find_breaker_for_score_threat",
      ]),
    );
  });

  it("prefers a useful install over draw two into hand overflow without urgency", () => {
    const rdRun = legalAction("run-rd", "runner", "start_run", {
      serverId: "rd",
    });
    const drawTwo = legalAction("draw-two", "runner", "draw_card", {
      amount: 2,
    });
    const install = legalAction(
      "install-access-card",
      "runner",
      "install_card",
      {},
      {
        source: "access-card",
      },
    );
    const input = aiInput("runner", [rdRun, drawTwo, install]);
    input.playerView.own.gripOrHq = [
      visibleCard("access-card", "runner", "hardware"),
      visibleCard("filler-1", "runner", "event"),
      visibleCard("filler-2", "runner", "event"),
      visibleCard("filler-3", "runner", "event"),
      visibleCard("filler-4", "runner", "event"),
    ];
    input.playerView.own.maxHandSize = 5;
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ]),
      server("archives"),
    ];
    const handDevelopmentEvaluations = [
      runnerHandDevelopmentEvaluation({
        cardInstanceId: "access-card",
        developmentRole: "access_payoff",
        strategicFit: "strong",
        currentNeed: "useful_now",
        priority: 650,
        legalActionId: install.actionId,
      }),
    ];

    const result = evaluateTacticalPlans({
      input,
      runnerHandDevelopmentEvaluations: handDevelopmentEvaluations,
      candidates: [
        candidateForUntargetedAction(rdRun),
        candidateForUntargetedAction(drawTwo),
        candidateForUntargetedAction(install),
      ],
    });
    const drawPlan = runnerCoverageTargetPlan(result.planAlternatives, "rd");

    expect(result.selectedPlan?.type).toBe("runner.play_best_hand_card");
    expect(result.selectedMapping?.legalActions[0]?.actionId).toBe(
      install.actionId,
    );
    expect(drawPlan?.evidence).toEqual(
      expect.arrayContaining([
        "hand_limit_pressure:moderate",
        "projected_overflow:2",
        "useful_playable_cards_in_hand:1",
      ]),
    );
  });

  it("funds a useful hand-card plan when that card is blocked by credits", () => {
    const rdRun = legalAction("run-rd", "runner", "start_run", {
      serverId: "rd",
    });
    const draw = legalAction("draw", "runner", "draw_card");
    const gain = legalAction("gain", "runner", "gain_credit");
    const input = aiInput("runner", [rdRun, draw, gain]);
    input.playerView.own.credits = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("expensive-economy", "runner", "resource", {
        installCost: 4,
      }),
      visibleCard("filler-1", "runner", "event"),
      visibleCard("filler-2", "runner", "event"),
      visibleCard("filler-3", "runner", "event"),
      visibleCard("filler-4", "runner", "event"),
    ];
    input.playerView.own.maxHandSize = 5;
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ]),
      server("archives"),
    ];
    const handDevelopmentEvaluations = [
      runnerHandDevelopmentEvaluation({
        cardInstanceId: "expensive-economy",
        availability: "missing_credits",
        developmentRole: "economy_engine",
        strategicFit: "blocked",
        currentNeed: "useful_now",
        priority: 650,
        fundingNeed: {
          installOrPlayCost: 4,
          missingCredits: 3,
          reason: "cannot_pay",
        },
        deferReason: "missing_credits",
      }),
    ];
    const economyPosture = runnerEconomyPosture({
      currentCredits: 1,
      usefulHandCardsBlockedByCredits: 1,
      recommendation: "fund_useful_hand_card",
      economyPriority: "high",
    });

    const result = evaluateTacticalPlans({
      input,
      runnerHandDevelopmentEvaluations: handDevelopmentEvaluations,
      runnerEconomyPosture: economyPosture,
      candidates: [
        candidateForUntargetedAction(rdRun),
        candidateForUntargetedAction(draw),
        candidateForUntargetedAction(gain),
      ],
    });

    expect(result.selectedPlan).toMatchObject({
      planId: "runner.develop_hand_card:expensive-economy",
      type: "runner.develop_hand_card",
    });
    expect(result.selectedStep?.kind).toBe("gain_credits");
    expect(result.selectedPlan?.blockers.map((blocker) => blocker.kind)).toEqual(
      expect.arrayContaining(["missing_credits"]),
    );
    expect(result.selectedPlan?.evidence).toEqual(
      expect.arrayContaining([
        "hand_card_funding_plan:true",
        "funding_missing_credits:3",
      ]),
    );
    expect(result.selectedMapping?.legalActions[0]?.actionId).toBe(
      gain.actionId,
    );
    expect(input.legalActions.map((action) => action.actionId)).toContain(
      result.selectedMapping?.legalActions[0]?.actionId,
    );
  });

  it("does not offer hand-card funding plans when no credit action is currently legal", () => {
    const endTurn = legalAction(
      "end-turn",
      "runner",
      "end_turn",
      {},
      { source: "game_rule" },
    );
    const input = aiInput("runner", [endTurn]);
    input.playerView.own.credits = 1;
    input.playerView.own.clicks = 0;
    input.playerView.own.gripOrHq = [
      visibleCard("expensive-economy", "runner", "resource", {
        installCost: 4,
      }),
    ];

    const plans = buildTacticalPlans({
      input,
      runnerHandDevelopmentEvaluations: [
        runnerHandDevelopmentEvaluation({
          cardInstanceId: "expensive-economy",
          availability: "missing_credits",
          developmentRole: "economy_engine",
          strategicFit: "blocked",
          currentNeed: "useful_now",
          priority: 650,
          fundingNeed: {
            installOrPlayCost: 4,
            missingCredits: 3,
            reason: "cannot_pay",
          },
          deferReason: "missing_credits",
        }),
      ],
      runnerEconomyPosture: runnerEconomyPosture({
        currentCredits: 1,
        usefulHandCardsBlockedByCredits: 1,
        recommendation: "fund_useful_hand_card",
        economyPriority: "high",
      }),
    });

    expect(plans.map((plan) => plan.planId)).not.toContain(
      "runner.develop_hand_card:expensive-economy",
    );
    expect(plans.map((plan) => plan.currentStep.kind)).not.toContain(
      "gain_credits",
    );
  });

  it("treats generic credit and draw setup as support when open R&D is available", () => {
    const rdRun = legalAction("run-rd", "runner", "start_run", {
      serverId: "rd",
    });
    const draw = legalAction("draw", "runner", "draw_card");
    const gain = legalAction("gain", "runner", "gain_credit");
    const input = aiInput("runner", [rdRun, draw, gain]);
    input.playerView.own.credits = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("single-card", "runner", "event"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];

    const result = evaluateTacticalPlans({
      input,
      runnerEconomyPosture: runnerEconomyPosture({
        currentCredits: 1,
        usefulHandCardsBlockedByCredits: 1,
        recommendation: "fund_useful_hand_card",
        economyPriority: "high",
      }),
      candidates: [
        candidateForAction(rdRun),
        candidateForUntargetedAction(draw),
        candidateForUntargetedAction(gain),
      ],
    });

    expect(result.selectedPlan).toMatchObject({
      planId: "runner.opportunistic_central_run:rd",
      type: "runner.opportunistic_central_run",
    });
    expect(result.selectedMapping?.legalActions[0]?.actionId).toBe(
      rdRun.actionId,
    );
    expect(result.planAlternatives.map((plan) => plan.type)).not.toContain(
      "runner.build_credit_base",
    );
    expect(result.planAlternatives.map((plan) => plan.type)).not.toContain(
      "runner.restore_hand_buffer",
    );
  });

  it("reduces draw overflow penalty when clear discard fodder covers the overflow", () => {
    const rdRun = legalAction("run-rd", "runner", "start_run", {
      serverId: "rd",
    });
    const drawTwo = legalAction("draw-two", "runner", "draw_card", {
      amount: 2,
    });
    const input = aiInput("runner", [rdRun, drawTwo]);
    input.playerView.own.gripOrHq = [
      visibleCard("low-a", "runner", "event"),
      visibleCard("low-b", "runner", "event"),
      visibleCard("setup-a", "runner", "program"),
      visibleCard("setup-b", "runner", "program"),
      visibleCard("setup-c", "runner", "hardware"),
    ];
    input.playerView.own.maxHandSize = 5;
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ]),
      server("archives"),
    ];
    const handDevelopmentEvaluations = [
      runnerHandDevelopmentEvaluation({
        cardInstanceId: "low-a",
        developmentRole: "duplicate_or_low_value",
        strategicFit: "weak",
        currentNeed: "none",
        priority: 120,
        deferReason: "duplicate",
      }),
      runnerHandDevelopmentEvaluation({
        cardInstanceId: "low-b",
        developmentRole: "duplicate_or_low_value",
        strategicFit: "weak",
        currentNeed: "none",
        priority: 120,
        deferReason: "duplicate",
      }),
    ];

    const plans = buildTacticalPlans({
      input,
      runnerHandDevelopmentEvaluations: handDevelopmentEvaluations,
    });
    const drawPlan = runnerCoverageTargetPlan(plans, "rd");

    expect(drawPlan?.evidence).toEqual(
      expect.arrayContaining([
        "hand_limit_pressure:moderate",
        "projected_overflow:2",
        "discard_fodder_count:2",
        "draw_overflow_penalty:60",
      ]),
    );
  });

  it("prefers credits over further draw when already over hand limit and no urgent need exists", () => {
    const rdRun = legalAction("run-rd", "runner", "start_run", {
      serverId: "rd",
    });
    const draw = legalAction("draw", "runner", "draw_card");
    const gain = legalAction("gain", "runner", "gain_credit");
    const input = aiInput("runner", [rdRun, draw, gain]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("filler-1", "runner", "event"),
      visibleCard("filler-2", "runner", "event"),
      visibleCard("filler-3", "runner", "event"),
      visibleCard("filler-4", "runner", "event"),
      visibleCard("filler-5", "runner", "event"),
      visibleCard("filler-6", "runner", "event"),
    ];
    input.playerView.own.maxHandSize = 5;
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ]),
      server("archives"),
    ];
    const economyPosture = runnerEconomyPosture({
      currentCredits: 5,
      recommendation: "allow_pressure",
      economyPriority: "low",
    });

    const result = evaluateTacticalPlans({
      input,
      runnerEconomyPosture: economyPosture,
      candidates: [
        candidateForUntargetedAction(rdRun),
        candidateForUntargetedAction(draw),
        candidateForUntargetedAction(gain),
      ],
    });

    expect(result.selectedPlan?.type).toBe("runner.build_credit_base");
    expect(result.selectedMapping?.legalActions[0]?.actionId).toBe(
      gain.actionId,
    );
  });

  it("blocks corp score windows that are not protected yet", () => {
    const input = aiInput("corp", [
      legalAction(
        "advance-agenda",
        "corp",
        "advance_card",
        {},
        {
          source: "agenda-1",
        },
      ),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [],
        [
          visibleCard("agenda-1", "corp", "agenda", {
            advancementCounters: 0,
            advancementRequirement: 3,
          }),
        ],
      ),
    ];

    const plans = buildTacticalPlans({ input });
    const scorePlan = plans.find(
      (plan) => plan.type === "corp.create_score_window",
    );

    expect(scorePlan?.status).toBe("blocked");
    expect(scorePlan?.currentStep.kind).toBe("protect_remote");
    expect(scorePlan?.blockers.map((blocker) => blocker.kind)).toEqual(
      expect.arrayContaining(["score_window_unprotected"]),
    );
    expect(scorePlan?.nextSteps.map((step) => step.kind)).toEqual(
      expect.arrayContaining([
        "build_remote",
        "protect_remote",
        "build_rez_reserve",
        "advance_score_card",
        "score_agenda",
      ]),
    );
  });

  it("builds a rez reserve before advancing in a protected low-credit remote", () => {
    const input = aiInput("corp", [
      legalAction(
        "advance-agenda",
        "corp",
        "advance_card",
        {},
        {
          source: "agenda-1",
        },
      ),
      legalAction("gain", "corp", "gain_credit"),
    ]);
    input.playerView.own.credits = 2;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-ice", "corp", "ice", {
            rezzed: false,
          }),
        ],
        [
          visibleCard("agenda-1", "corp", "agenda", {
            advancementCounters: 0,
            advancementRequirement: 3,
          }),
        ],
      ),
    ];

    const plans = buildTacticalPlans({ input });
    const scorePlan = plans.find(
      (plan) => plan.type === "corp.create_score_window",
    );

    expect(scorePlan?.status).toBe("blocked");
    expect(scorePlan?.currentStep.kind).toBe("build_rez_reserve");
    expect(scorePlan?.blockers.map((blocker) => blocker.kind)).toEqual(
      expect.arrayContaining(["missing_rez_reserve"]),
    );
  });

  it("blocks corp score windows in protected but runner-contestable remotes", () => {
    const input = aiInput("corp", [
      legalAction(
        "advance-agenda",
        "corp",
        "advance_card",
        { serverId: "remote_1" },
        { source: "agenda-1" },
      ),
      legalAction("gain", "corp", "gain_credit"),
    ]);
    input.playerView.opponent.credits = 8;
    input.playerView.opponent.rig = [
      visibleCard("onr_v1_021_dwarf", "runner", "program", {
        subtypes: ["Icebreaker", "Worm"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("onr_v1_279_wall-of-static", "corp", "ice", {
            rezzed: true,
          }),
        ],
        [
          visibleCard("agenda-1", "corp", "agenda", {
            advancementCounters: 0,
            advancementRequirement: 3,
          }),
        ],
      ),
    ];

    const plans = buildTacticalPlans({ input });
    const scorePlan = plans.find(
      (plan) => plan.type === "corp.create_score_window",
    );

    expect(scorePlan?.status).toBe("blocked");
    expect(scorePlan?.currentStep.kind).toBe("protect_remote");
    expect(scorePlan?.blockers.map((blocker) => blocker.kind)).toEqual(
      expect.arrayContaining(["score_window_contestable"]),
    );
    expect(JSON.stringify(scorePlan)).toContain(
      "remote_contestable_by_runner:true",
    );
  });

  it("maps remote hardening into the score-window plan when runner can fund access before score", () => {
    const advance = legalAction(
      "advance-agenda",
      "corp",
      "advance_card",
      { serverId: "remote_1" },
      { source: "agenda-1" },
    );
    const installIce = legalAction(
      "install-remote-ice",
      "corp",
      "install_card",
      { placement: "ice", serverId: "remote_1" },
      { source: "remote-ice-2" },
    );
    const input = aiInput("corp", [advance, installIce]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("remote-ice-2", "corp", "ice", {
        definitionId: "simple_barrier_ice",
        subtypes: ["Barrier"],
      }),
    ];
    input.playerView.opponent.credits = 2;
    input.playerView.opponent.rig = [
      visibleCard("runner-fracter", "runner", "program", {
        definitionId: "simple_fracter",
        subtypes: ["Icebreaker", "Fracter"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-ice-1", "corp", "ice", {
            definitionId: "simple_barrier_ice",
            rezzed: true,
            subtypes: ["Barrier"],
          }),
        ],
        [
          visibleCard("agenda-1", "corp", "agenda", {
            advancementCounters: 1,
            advancementRequirement: 4,
          }),
        ],
      ),
    ];

    const plans = buildTacticalPlans({ input });
    const scorePlan = plans.find(
      (plan) => plan.type === "corp.create_score_window",
    );
    const mapping =
      scorePlan &&
      mapPlanStepToLegalActions(
        scorePlan,
        scorePlan.currentStep,
        [candidateForAction(advance), candidateForAction(installIce)],
        input,
      );

    expect(scorePlan?.status).toBe("blocked");
    expect(scorePlan?.currentStep.kind).toBe("protect_remote");
    expect(scorePlan?.blockers.map((blocker) => blocker.kind)).toEqual(
      expect.arrayContaining(["score_window_contestable"]),
    );
    expect(JSON.stringify(scorePlan)).toContain(
      "runner_visible_exposure_contest_credits:5",
    );
    expect(mapping && mapping.status).toBe("matched");
    expect(
      mapping && mapping.legalActions.map((action) => action.actionId),
    ).toEqual(["install-remote-ice"]);
  });

  it("isolates tactical plan memory by decision context", () => {
    resetTacticalPlanMemory();
    const draw = legalAction("draw", "runner", "draw_card");
    const inputA = aiInput("runner", [draw]);
    inputA.decisionId = "match-a:1:runner";
    const inputB = aiInput("runner", [draw]);
    inputB.decisionId = "match-b:1:runner";
    inputB.profileId = inputA.profileId;
    const plan = createTacticalPlan({
      planId: "runner.obtain_breaker_coverage:rd",
      side: "runner",
      type: "runner.obtain_breaker_coverage",
      status: "active",
      priority: 900,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "draw_for_answer:rd",
        kind: "draw_for_answer",
        desiredActionSemantics: ["draw.card"],
      }),
      stateVersion: 1,
    });

    rememberTacticalPlanRuntime(
      inputA,
      {
        planAlternatives: [plan],
        blockedPlans: [],
        selectedPlan: plan,
        selectedStep: plan.currentStep,
      },
      draw,
    );

    expect(getTacticalPlanMemorySnapshot(inputA)?.memoryId).toBe(
      "match-a:runner:runner-tactical-plan-test",
    );
    expect(getTacticalPlanMemorySnapshot(inputB)).toBeUndefined();
  });

  it("returns redacted deck capability facts in runtime results", () => {
    const input = aiInput("runner", [
      legalAction("run-remote", "runner", "start_run", {
        serverId: "remote_1",
      }),
      legalAction("draw", "runner", "draw_card"),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("simple_barrier_ice", "corp", "ice", {
            rezzed: true,
            subtypes: ["Wall"],
          }),
        ],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];
    const deckCapabilities = buildDeckCapabilityProfile({
      side: "runner",
      playerView: input.playerView,
      legalActions: input.legalActions,
      deckSnapshot: {
        deckSnapshotId: "tactical-plan-redacted-debug-test",
        side: "runner",
        cards: [
          { cardId: "onr_v1_021_dwarf", quantity: 1 },
          { cardId: "onr_v1_154_broker", quantity: 1 },
        ],
      },
    });

    const result = evaluateTacticalPlans({ input, deckCapabilities });
    const facts = result.deckCapabilitiesUsed?.join("\n") ?? "";

    expect(result.deckCapabilitiesUsed).toEqual(
      expect.arrayContaining(["breaker.wall=in_deck/draw_only"]),
    );
    expect(facts).not.toMatch(/onr_v1_|Dwarf|Broker/);
  });

  it("translates Runner strategic central pressure into a targeted central plan", () => {
    const hqRun = legalAction("run-hq", "runner", "start_run", {
      serverId: "hq",
    });
    const rdRun = legalAction("run-rd", "runner", "start_run", {
      serverId: "rd",
    });
    const input = aiInput("runner", [hqRun, rdRun]);
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
    });

    const result = evaluateTacticalPlans({
      input,
      candidates,
      tacticalGoals: [
        {
          goalId: "runner.strategic.central_pressure",
          family: "pressure",
          priority: 900,
          urgency: "high",
          targetServerId: "hq",
          source: "strategic_intent",
          evidence: ["test:strategic_hq_pressure"],
        },
      ],
    });

    expect(result.selectedPlan).toMatchObject({
      planId: "runner.opportunistic_central_run:hq",
      type: "runner.opportunistic_central_run",
      priority: expect.any(Number),
    });
    expect(
      result.selectedMapping?.legalActions.map((action) => action.actionId),
    ).toEqual(["run-hq"]);
    expect(result.selectedPlan?.evidence).toEqual(
      expect.arrayContaining([
        "strategic_plan_goal:runner.strategic.central_pressure",
        "test:strategic_hq_pressure",
      ]),
    );
  });

  it("selects unguarded unknown R&D pressure before continued high creditbase setup", () => {
    const rdRun = legalAction("run-rd", "runner", "start_run", {
      serverId: "rd",
    });
    const gain = legalAction("gain", "runner", "gain_credit");
    const input = aiInput("runner", [rdRun, gain]);
    input.playerView.own.credits = 5;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    const handDevelopmentEvaluations = [
      runnerHandDevelopmentEvaluation({
        cardInstanceId: "runner-useful-missing-credit",
        availability: "missing_credits",
        developmentRole: "access_payoff",
        currentNeed: "useful_now",
        priority: 650,
        fundingNeed: {
          installOrPlayCost: 6,
          missingCredits: 1,
          reason: "cannot_pay",
        },
        deferReason: "missing_credits",
      }),
    ];
    const runnerRunTargetEvaluations = evaluateRunnerRunTargets({
      input,
      handDevelopmentEvaluations,
    });
    const rdEvaluation = runnerRunTargetEvaluations.find(
      (evaluation) => evaluation.targetServerId === "rd",
    );
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
    });

    const result = evaluateTacticalPlans({
      input,
      runnerRunTargetEvaluations,
      runnerHandDevelopmentEvaluations: handDevelopmentEvaluations,
      runnerEconomyPosture: runnerEconomyPosture({
        currentCredits: 5,
        usefulHandCardsBlockedByCredits: 1,
        recommendation: "fund_useful_hand_card",
        economyPriority: "high",
      }),
      previousPlan: {
        schemaVersion: "tactical-plan-v1",
        memoryId: "previous-credit-base",
        side: "runner",
        planId: "runner.build_credit_base",
        type: "runner.build_credit_base",
        status: "progressing",
        target: { kind: "capability", id: "runner_credit_base" },
        selectedStepKind: "gain_credits",
        selectedActionId: "gain",
        blockedBy: [],
        ttlDecisionsRemaining: 2,
        planProgressionReason: "previous_plan_considered",
        updatedAtStateVersion: 43,
      },
      candidates,
    });
    const rdPlan = result.planAlternatives.find(
      (plan) => plan.planId === "runner.opportunistic_central_run:rd",
    );
    const creditPlan = result.planAlternatives.find(
      (plan) => plan.planId === "runner.build_credit_base",
    );

    expect(rdEvaluation).toMatchObject({
      knownAccessState: "unknown",
      pathPassability: "reachable",
      pathCost: 0,
      recommendation: "run_now",
    });
    expect(result.selectedPlan?.planId).toBe(
      "runner.opportunistic_central_run:rd",
    );
    expect(result.selectedMapping?.legalActions[0]?.actionId).toBe(
      rdRun.actionId,
    );
    expect(rdPlan?.priority).toBeGreaterThan(creditPlan?.priority ?? -Infinity);
    expect(rdPlan?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_rd_unknown_low_cost_opportunity_floor",
          label: "R&D unbekannte Topkarte",
        }),
      ]),
    );
    expect(creditPlan).toBeUndefined();
    expect(result.planProgressionReason).toBe(
      "previous_credit_base_interrupted_by_rd_opportunity",
    );
  });

  it("selects tag cleanup before ordinary runner pressure plans", () => {
    const removeTag = legalAction("remove-tag", "runner", "remove_tag");
    const rdRun = legalAction("run-rd", "runner", "start_run", {
      serverId: "rd",
    });
    const input = aiInput("runner", [rdRun, removeTag]);
    input.playerView.own.tags = 1;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
    });

    const result = evaluateTacticalPlans({ input, candidates });

    expect(result.selectedPlan).toMatchObject({
      planId: "runner.clear_tags_or_survive",
      type: "runner.clear_tags_or_survive",
      currentStep: expect.objectContaining({
        kind: "clear_tags",
      }),
    });
    expect(
      result.selectedMapping?.legalActions.map((action) => action.actionId),
    ).toEqual(["remove-tag"]);
    expect(result.selectedPlan?.evidence).toEqual(
      expect.arrayContaining([
        "runner_current_tags:1",
        "runner_tag_clear_plan_active:true",
      ]),
    );
  });

  it("selects a successful-run follow-up before ordinary economy", () => {
    const successFollowup = {
      ...legalAction(
        "credit-subversion-followup",
        "runner",
        "trigger_ability",
        {
          serverId: "hq",
          cardImplementationAbilityKey: "successful_run_before_access:0",
        },
        { source: "credit-subversion" },
      ),
      timingPoint: "run.access" as LegalAction["timingPoint"],
    };
    const gain = legalAction("gain-credit", "runner", "gain_credit");
    const input = aiInput("runner", [gain, successFollowup]);
    input.playerView.run = {
      attackedServerId: "hq",
      phase: "access",
      successful: true,
    };
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    const successCandidate = {
      ...candidateForAction(successFollowup),
      semanticActionType: "card_ability.trigger",
      actionTacticSignals: ["run.success_followup", "access.payoff"],
      evidence: ["successful_run_before_access_effect"],
    } as ActionSemanticCandidate;
    const gainCandidate = candidateForUntargetedAction(gain);

    const result = evaluateTacticalPlans({
      input,
      candidates: [gainCandidate, successCandidate],
    });

    expect(result.selectedPlan).toMatchObject({
      planId: "runner.convert_success_window:hq",
      type: "runner.convert_success_window",
      currentStep: expect.objectContaining({
        kind: "convert_success_window",
      }),
    });
    expect(
      result.selectedMapping?.legalActions.map((action) => action.actionId),
    ).toEqual(["credit-subversion-followup"]);
    expect(result.selectedPlan?.evidence).toEqual(
      expect.arrayContaining([
        "runner_success_window_plan_active:true",
        "runner_success_window_target:hq",
      ]),
    );
  });

  it("translates Corp punish intent into a mapped punish pressure plan", () => {
    const punish = legalAction(
      "play-punish",
      "corp",
      "play_operation",
      { sourceDefinitionId: "corp-punish-card" },
      { source: "corp-punish-card" },
    );
    const reveal = legalAction(
      "reveal-rd-top",
      "corp",
      "gain_credit",
      {
        abilityFamily: "hidden-zone",
        effectKind: "hidden_zone",
      },
      { source: "scored-agenda" },
    );
    const input = aiInput("corp", [punish, reveal]);
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      cardSemanticProfilesByDefinitionId: {
        "corp-punish-card": {
          cardId: "corp-punish-card",
          tacticSignals: ["tag.source", "tag.payoff"],
        },
      },
    }).map((candidate) =>
      candidate.actionId === reveal.actionId
        ? ({
            ...candidate,
            semanticActionType: "card_ability.trigger",
            actionTacticSignals: ["card_ability.trigger", "zone.reveal"],
            strategySupport: [
              {
                strategyId: "corp.tag_trace_punish",
                role: "support",
                confidence: "high",
                evidence: "deck supports punish",
              },
            ],
            evidence: [
              ...candidate.evidence,
              "strategic_action_fit:corp.tag_trace_punish",
            ],
          } satisfies ActionSemanticCandidate)
        : candidate,
    );

    const result = evaluateTacticalPlans({
      input,
      candidates,
      tacticalGoals: [
        {
          goalId: "corp.intent.punish",
          family: "tag_punish",
          priority: 820,
          urgency: "medium",
          source: "strategic_intent",
          evidence: ["test:corp_punish_intent"],
        },
      ],
    });

    expect(result.selectedPlan).toMatchObject({
      planId: "corp.apply_punish_pressure:play-punish",
      type: "corp.apply_punish_pressure",
    });
    expect(
      result.selectedMapping?.legalActions.map((action) => action.actionId),
    ).toEqual(["play-punish"]);
    expect(result.selectedPlan?.evidence).toEqual(
      expect.arrayContaining([
        "strategic_plan_goal:corp.intent.punish",
        "punish_tactic:tag.source",
        "punish_tactic:tag.payoff",
      ]),
    );
  });

  it("maps Corp scoreline installs into the score-window plan before punish pressure", () => {
    const installAgenda = legalAction(
      "install-scoreline-agenda",
      "corp",
      "install_card",
      { placement: "root", serverId: "remote_1" },
      { source: "agenda-1" },
    );
    const punish = legalAction(
      "use-punish",
      "corp",
      "activated_card_ability",
      {},
      { source: "punish-card" },
    );
    const input = aiInput("corp", [installAgenda, punish]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-ice", "corp", "ice", {
          definitionId: "simple_barrier_ice",
          rezzed: true,
          subtypes: ["Barrier"],
        }),
      ]),
    ];
    const scorelineCandidate = {
      ...candidateForAction(installAgenda),
      semanticActionType: "scoreline",
      actionTacticSignals: ["install.card"],
      evidence: ["scoreline"],
    } satisfies ActionSemanticCandidate;
    const punishCandidate = {
      ...candidateForUntargetedAction(punish),
      semanticActionType: "card_ability.unknown",
      actionTacticSignals: ["tag.payoff"],
      cardContextSignals: ["tag.source"],
    } satisfies ActionSemanticCandidate;

    const result = evaluateTacticalPlans({
      input,
      candidates: [scorelineCandidate, punishCandidate],
      tacticalGoals: [
        {
          goalId: "corp.intent.punish",
          family: "tag_punish",
          priority: 900,
          urgency: "high",
          source: "strategic_intent",
          evidence: ["test:corp_punish_intent"],
        },
      ],
    });

    expect(result.selectedPlan).toMatchObject({
      planId: "corp.create_score_window:install-scoreline-agenda",
      type: "corp.create_score_window",
    });
    expect(
      result.selectedMapping?.legalActions.map((action) => action.actionId),
    ).toEqual(["install-scoreline-agenda"]);
  });
});

function runnerHandDevelopmentEvaluation(
  overrides: Partial<RunnerHandDevelopmentEvaluation> & {
    cardInstanceId: string;
  },
): RunnerHandDevelopmentEvaluation {
  const { cardInstanceId, ...rest } = overrides;
  return {
    schemaVersion: "runner-hand-development-evaluation-v1",
    cardInstanceId,
    availability: "legal_now",
    developmentRole: "access_payoff",
    strategicFit: "strong",
    currentNeed: "useful_now",
    priority: 650,
    deferReason: "none",
    evidence: [],
    ...rest,
  };
}

function persistentInstallEvaluation(
  overrides: Partial<RunnerPersistentInstallEvaluation> & {
    actionId: string;
  },
): RunnerPersistentInstallEvaluation {
  const { actionId, ...rest } = overrides;
  return {
    schemaVersion: "runner-persistent-install-evaluation-v1",
    actionId,
    cardType: "program",
    installCost: 0,
    creditsAfterInstall: 4,
    handAfterInstall: 3,
    installedSameDefinitionCount: 0,
    installedSameFunctionalGroupCount: 0,
    existingFunctionalCoverage: [],
    newFunctionalCoverage: [],
    capabilityDelta: "none",
    stackabilityClass: "unknown",
    duplicateRole: "none",
    marginalUtilityScore: 0,
    opportunityPenalty: 0,
    reservePenalty: 0,
    handBufferPenalty: 0,
    muPressurePenalty: 0,
    displacementPenalty: 0,
    finalInstallFit: 0,
    evidence: [],
    ...rest,
  };
}

function runnerEconomyPosture(overrides: {
  currentCredits: number;
  usefulHandCardsBlockedByCredits?: number;
  recommendation?: RunnerEconomyPosture["creditBasePlan"]["recommendation"];
  economyPriority?: RunnerEconomyPosture["creditBasePlan"]["economyPriority"];
}): RunnerEconomyPosture {
  const usefulHandCardsBlockedByCredits =
    overrides.usefulHandCardsBlockedByCredits ?? 0;
  const recommendation = overrides.recommendation ?? "allow_pressure";
  const economyPriority = overrides.economyPriority ?? "low";
  const creditReservePolicy = {
    schemaVersion: 1 as const,
    phase: "opening" as const,
    currentCredits: overrides.currentCredits,
    minimumCreditFloor: 2,
    breakerUseReserve: 2,
    contestReserve: 0,
    developmentReserve: 4,
    emergencyReserve: 0,
    desiredCreditReserve: 4,
    remoteScoreThreat: "none" as const,
    canContestIfFunded: false,
    belowReserveNow: overrides.currentCredits < 4,
    spendingWouldDropBelowReserve: false,
    reserveDrivers: ["phase:opening"],
    reserveOverrides: [],
    evidence: [],
  };
  return {
    schemaVersion: "runner-economy-posture-v1",
    minimumCreditFloor: 2,
    desiredCreditReserve: 4,
    creditReservePolicy,
    creditBasePlan: {
      schemaVersion: "runner-credit-base-plan-v1",
      currentCredits: overrides.currentCredits,
      minimumCreditFloor: 2,
      desiredCreditReserve: 4,
      runCostReserve: 2,
      creditReservePolicy,
      fundingNeed: economyPriority === "high",
      usefulHandCardsBlockedByCredits,
      usefulHandCardsAffordableNow: 0,
      recommendation,
      economyPriority,
      evidence: [],
    },
    riskAdjustedRunReserve: false,
    buildEconomyBeforePressure: economyPriority !== "low",
    bankToolsRelevant: false,
    fundingNeed: economyPriority === "high",
    recommendation: economyPriority === "high" ? "build_economy" : "stable",
    evidence: [],
  };
}

function aiInput(side: Side, legalActions: LegalAction[]): AiDecisionInput {
  return {
    side,
    playerView: playerView(side, legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "tactical-plan-test",
    decisionId: `tactical-plan-test:${side}`,
    actionNumber: 1,
    profileId: `${side}-tactical-plan-test`,
  };
}

function playerView(side: Side, legalActions: LegalAction[]): PlayerView {
  const opponentSide = side === "runner" ? "corp" : "runner";
  return {
    stateVersion: 1,
    side,
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    own: {
      identity: visibleIdentity(side),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 0,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity(opponentSide),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  ice: VisibleCard[] = [],
  root: VisibleCard[] = [],
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root,
  };
}

function visibleCard(
  instanceId: string,
  side: Side,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Omit<
    Partial<VisibleCard>,
    "instanceId" | "owner" | "controller" | "type" | "known"
  > = {},
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    owner: side,
    controller: side,
    type,
    known: true,
    ...overrides,
  };
}

function publicEvent(
  eventId: string,
  stateVersionAfter: number,
  type: string,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload,
  };
}

function visibleIdentity(side: Side): PlayerView["own"]["identity"] {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}

function legalAction(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
  options: { source?: LegalAction["source"]; label?: string } = {},
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: options.label ?? actionId,
    source: options.source ?? "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [{ credits: 0 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    ...(Object.keys(payload).length > 0 ? { payload } : {}),
  };
}

type TestTacticalPlan = ReturnType<typeof buildTacticalPlans>[number];

function runnerCoverageTargetPlan(
  plans: readonly TestTacticalPlan[],
  serverId: string,
): TestTacticalPlan | undefined {
  const planType = serverId.startsWith("remote_")
    ? "runner.contest_remote"
    : "runner.opportunistic_central_run";
  return plans.find((plan) => plan.planId === `${planType}:${serverId}`);
}

function coverageSearchPlan(kind: "breaker_wall" | "breaker_code_gate") {
  return createTacticalPlan({
    planId: "runner.obtain_breaker_coverage:remote_1",
    side: "runner",
    type: "runner.obtain_breaker_coverage",
    status: "active",
    priority: 900,
    horizonTurns: 1,
    currentStep: createPlanStep({
      stepId: "search_for_answer:remote_1",
      kind: "search_for_answer",
      desiredActionSemantics: [
        "card_ability.trigger",
        "card_ability.unknown",
        "play.runner_event",
        "draw.card",
      ],
      requiredCapabilities: [
        {
          capabilityId: `coverage:${kind}`,
          kind,
          side: "runner",
          target: { kind: "capability", id: kind },
          evidence: [`activeRequiredCapability:${kind}`],
        },
      ],
      rationale: ["need breaker coverage before the run"],
    }),
    requiredCapabilities: [
      {
        capabilityId: `coverage:${kind}`,
        kind,
        side: "runner",
        target: { kind: "capability", id: kind },
        evidence: [`activeRequiredCapability:${kind}`],
      },
    ],
    stateVersion: 1,
  });
}

function wallCoverageInput(actions: LegalAction[]): AiDecisionInput {
  const input = aiInput("runner", actions);
  input.playerView.own.rig = [];
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server(
      "remote_1",
      [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ],
      [visibleCard("simple_agenda", "corp", "agenda")],
    ),
  ];
  return input;
}

function rdAccessEvent(
  eventId: string,
  stateVersionBefore: number,
  cardDefinitionId: string,
): PublicGameEvent {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId,
    },
  };
}

function hqPrivateLookEvent(
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

function candidateForAction(action: LegalAction): ActionSemanticCandidate {
  return {
    actionId: action.actionId,
    actionType: action.type,
    actorSide: action.side,
    visibilityScope: "public",
    legalActionRef: {
      actionId: action.actionId,
      actionType: action.type,
      originalPayloadKeys: Object.keys(action.payload ?? {}),
    },
    sourceKind: "basic_action",
    abilityBindingMethod: "unresolved",
    semanticActionType: "run",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    targetContext: {
      selectedTargets: [
        {
          targetId: String(action.payload?.serverId ?? "unknown"),
          targetKind: "server",
          targetSide: "corp",
          visibilityScope: "public",
          evidence: ["test"],
        },
      ],
      targetKind: "server",
      targetZones: [],
      targetSide: "corp",
      hiddenInfoPolicy: "side_safe",
      availableTargetsStatus: "engine_provided",
      targetProfileMatches: [],
      targetConstraintResults: [],
    },
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: ["test candidate"],
  };
}

function candidateForUntargetedAction(
  action: LegalAction,
): ActionSemanticCandidate {
  const semanticActionType: ActionSemanticCandidate["semanticActionType"] =
    action.type === "draw_card"
      ? "draw.card"
      : action.type === "gain_credit"
        ? "economy.gain_credit"
        : action.type === "install_card"
          ? "install.card"
          : "run";
  const candidate = candidateForAction(action);
  if (!candidate.targetContext) return { ...candidate, semanticActionType };
  return {
    ...candidate,
    semanticActionType,
    targetContext: { ...candidate.targetContext, selectedTargets: [] },
  };
}

function candidateForActionWithSelectedTargets(
  action: LegalAction,
  selectedTargets: NonNullable<
    ActionSemanticCandidate["targetContext"]
  >["selectedTargets"],
): ActionSemanticCandidate {
  const candidate = candidateForAction(action);
  const targetContext = candidate.targetContext;
  if (!targetContext) return candidate;
  return {
    ...candidate,
    targetContext: {
      ...targetContext,
      selectedTargets,
    },
  };
}
