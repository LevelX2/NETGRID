import { describe, expect, it } from "vitest";

import {
  buildTacticalPlans,
  createPlanStep,
  createTacticalPlan,
  mapPlanStepToLegalActions,
  rankTacticalPlans,
} from "./tactical-plans";
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
        visibleCard("remote-wall", "corp", "ice", {
          rezzed: true,
          subtypes: ["Wall"],
        }),
      ]),
    ];

    const plans = buildTacticalPlans({ input });
    const coveragePlan = plans.find(
      (plan) => plan.type === "runner.obtain_breaker_coverage",
    );

    expect(coveragePlan?.requiredCapabilities[0]?.kind).toBe("breaker_wall");
    expect(coveragePlan?.currentStep.rationale[0]).toContain("breaker_wall");
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
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: actionId,
    source: "basic_action",
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
