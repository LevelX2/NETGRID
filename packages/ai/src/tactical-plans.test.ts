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
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import type { RunnerHandDevelopmentEvaluation } from "./runner-hand-development";
import type { RunnerEconomyPosture } from "./runner-run-target-evaluation";
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

    expect(rankTacticalPlans([blocked, active]).map((plan) => plan.planId)).toEqual([
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

    expect(rankTacticalPlans([freshActive, progressing]).map((plan) => plan.planId)).toEqual([
      "runner.contest_remote:remote_2",
      "runner.obtain_breaker_coverage:rd",
    ]);
    expect(rankTacticalPlans([freshActive, strongerProgressing]).map((plan) => plan.planId)).toEqual([
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
    const action = legalAction("use-smc", "runner", "trigger_ability", {}, {
      source: "smc-1",
      label: "Use ability",
    });
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

  it("maps bank steps from candidate bank semantics without label hints", () => {
    const action = legalAction("use-bank", "runner", "trigger_ability", {}, {
      source: "broker-1",
      label: "Use ability",
    });
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
      server("remote_1", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];

    const plans = buildTacticalPlans({ input });
    const coveragePlan = plans.find(
      (plan) => plan.type === "runner.obtain_breaker_coverage",
    );

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
    const coveragePlan = plans.find(
      (plan) => plan.planId === "runner.obtain_breaker_coverage:rd",
    );

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
      legalAction("smc-search", "runner", "trigger_ability", {}, {
        source: "onr_v1_059_self-modifying-code",
        label: "Self-Modifying Code: search your stack for a program",
      }),
    ]);
    input.playerView.own.rig = [
      visibleCard("onr_v1_059_self-modifying-code", "runner", "program"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
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
    const coveragePlan = plans.find(
      (plan) => plan.planId === "runner.obtain_breaker_coverage:remote_1",
    );

    expect(coveragePlan?.evidence).toEqual(
      expect.arrayContaining(["deck_capability:breaker_wall=in_deck/searchable"]),
    );
    expect(coveragePlan?.blockers.some((blocker) => blocker.kind === "coverage_not_in_deck")).toBe(false);
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
      server("remote_1", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
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
    const coveragePlan = plans.find(
      (plan) => plan.planId === "runner.obtain_breaker_coverage:remote_1",
    );

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
      server("remote_1", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
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
    const coveragePlan = plans.find(
      (plan) => plan.planId === "runner.obtain_breaker_coverage:remote_1",
    );

    expect(coveragePlan?.currentStep.kind).toBe("draw_for_answer");
    expect(coveragePlan?.currentStep.rationale).toEqual(
      expect.arrayContaining(["deck_capability:draw_only"]),
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
      server("remote_1", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
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
    const coveragePlan = plans.find(
      (plan) => plan.planId === "runner.obtain_breaker_coverage:remote_1",
    );
    const contestPlan = plans.find(
      (plan) => plan.planId === "runner.contest_remote:remote_1",
    );

    expect(coveragePlan?.currentStep.kind).toBe("resolve_missing_mu");
    expect(contestPlan?.blockers.map((blocker) => blocker.kind)).toEqual(
      expect.arrayContaining(["breaker_present_but_mu_blocked", "missing_mu"]),
    );
  });

  it("marks blocked central pressure as needing breaker coverage", () => {
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
    const coveragePlan = plans.find(
      (plan) => plan.planId === "runner.obtain_breaker_coverage:rd",
    );

    expect(centralPlan?.status).toBe("blocked");
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
    const coveragePlan = plans.find(
      (plan) => plan.planId === "runner.obtain_breaker_coverage:rd",
    );
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

  it("uses bank capability evidence for runner cashout plans", () => {
    const input = aiInput("runner", [
      legalAction("broker-cash", "runner", "trigger_ability", {}, {
        source: "onr_v1_154_broker",
        label: "Von Broker nehmen",
      }),
    ]);
    input.playerView.own.credits = 2;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource", {
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 3,
            displayKind: "stored_credits",
            label: "3",
            ariaLabel: "3 gespeicherte Credits",
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

    expect(cashoutPlan?.currentStep.requiredCapabilities[0]?.kind).toBe("bank_payout");
    expect(cashoutPlan?.evidence).toEqual(
      expect.arrayContaining([
        "bank_tool_count:1",
        "bank_estimated_payout:3",
      ]),
    );
  });

  it("labels hand-development plans with the concrete own hand card title", () => {
    const input = aiInput("runner", [
      legalAction("install-access-card", "runner", "install_card", {}, {
        source: "access-card",
      }),
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
      (plan) => plan.type === "runner.develop_hand_card",
    );

    expect(handPlan?.target).toMatchObject({
      kind: "card",
      id: "access-card",
      label: "Concrete Access Tool",
    });
    expect(handPlan?.evidence).toContain("hand_development_role:access_payoff");
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
      server("remote_1", [
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
      ], [
        visibleCard("simple_agenda", "corp", "agenda", {
          advancementCounters: 1,
        }),
      ]),
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
    const coveragePlan = plans.find(
      (plan) => plan.planId === "runner.obtain_breaker_coverage:remote_1",
    );
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
    const install = legalAction("install-access-card", "runner", "install_card", {}, {
      source: "access-card",
    });
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
    const drawPlan = result.planAlternatives.find(
      (plan) => plan.planId === "runner.obtain_breaker_coverage:rd",
    );

    expect(result.selectedPlan?.type).toBe("runner.develop_hand_card");
    expect(result.selectedMapping?.legalActions[0]?.actionId).toBe(install.actionId);
    expect(drawPlan?.evidence).toEqual(
      expect.arrayContaining([
        "hand_limit_pressure:moderate",
        "projected_overflow:2",
        "useful_playable_cards_in_hand:1",
      ]),
    );
  });

  it("prefers credit base when overdraw would risk a useful card blocked by credits", () => {
    const rdRun = legalAction("run-rd", "runner", "start_run", {
      serverId: "rd",
    });
    const draw = legalAction("draw", "runner", "draw_card");
    const gain = legalAction("gain", "runner", "gain_credit");
    const input = aiInput("runner", [rdRun, draw, gain]);
    input.playerView.own.credits = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("expensive-economy", "runner", "resource", { installCost: 4 }),
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

    expect(result.selectedPlan?.type).toBe("runner.build_credit_base");
    expect(result.selectedMapping?.legalActions[0]?.actionId).toBe(gain.actionId);
    expect(input.legalActions.map((action) => action.actionId)).toContain(
      result.selectedMapping?.legalActions[0]?.actionId,
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
    const drawPlan = plans.find(
      (plan) => plan.planId === "runner.obtain_breaker_coverage:rd",
    );

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
    expect(result.selectedMapping?.legalActions[0]?.actionId).toBe(gain.actionId);
  });

  it("blocks corp score windows that are not protected yet", () => {
    const input = aiInput("corp", [
      legalAction("advance-agenda", "corp", "advance_card", {}, {
        source: "agenda-1",
      }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [
        visibleCard("agenda-1", "corp", "agenda", {
          advancementCounters: 0,
          advancementRequirement: 3,
        }),
      ]),
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
      legalAction("advance-agenda", "corp", "advance_card", {}, {
        source: "agenda-1",
      }),
      legalAction("gain", "corp", "gain_credit"),
    ]);
    input.playerView.own.credits = 2;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-ice", "corp", "ice", {
          rezzed: false,
        }),
      ], [
        visibleCard("agenda-1", "corp", "agenda", {
          advancementCounters: 0,
          advancementRequirement: 3,
        }),
      ]),
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
      server("remote_1", [
        visibleCard("simple_barrier_ice", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
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
  return {
    schemaVersion: "runner-economy-posture-v1",
    minimumCreditFloor: 2,
    desiredCreditReserve: 4,
    creditBasePlan: {
      schemaVersion: "runner-credit-base-plan-v1",
      currentCredits: overrides.currentCredits,
      minimumCreditFloor: 2,
      desiredCreditReserve: 4,
      runCostReserve: 2,
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
    | "instanceId"
    | "definitionId"
    | "title"
    | "owner"
    | "controller"
    | "type"
    | "known"
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

function candidateForUntargetedAction(action: LegalAction): ActionSemanticCandidate {
  const semanticActionType: ActionSemanticCandidate["semanticActionType"] =
    action.type === "draw_card" ? "draw.card" :
    action.type === "gain_credit" ? "economy.gain_credit" :
    action.type === "install_card" ? "install.card" :
    "run";
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
  selectedTargets: NonNullable<ActionSemanticCandidate["targetContext"]>["selectedTargets"],
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
