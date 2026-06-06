import { describe, expect, it } from "vitest";

import {
  buildTacticalPlans,
  createPlanStep,
  createTacticalPlan,
  mapPlanStepToLegalActions,
  rankTacticalPlans,
} from "./tactical-plans";
import { buildDeckCapabilityProfile } from "./deck-capabilities";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
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

  it("keeps a progressing plan above a fresh active alternative", () => {
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
});

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
