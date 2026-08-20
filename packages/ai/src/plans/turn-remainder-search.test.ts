import {
  CURRENT_RULES_BASELINE,
  type AiDecisionInput,
  type VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type {
  ActionCapacityProjection,
  ActionSemanticCandidate,
} from "../action-semantic-candidate-types";
import {
  buildCanonicalLegalActionInvocation,
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
  type CampaignValueClaim,
  type PriorityCoverage,
  type TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";
import {
  searchDeterministicRemainderTurnPlans,
  type TurnRemainderSearchOffer,
} from "./turn-remainder-search";
import {
  assessTurnObservationBoundary,
  buildProjectedDecisionFrame,
} from "./turn-projection";

describe("deterministic remainder-turn search", () => {
  it("returns the same protected fronts regardless of root enumeration order", () => {
    const setup = searchSetup();
    const offers = [
      offer(setup, "economy", {
        root: "root:economy",
        milestone: "liquid",
        economy: 4,
      }),
      offer(setup, "defense", {
        root: "root:defense",
        milestone: "central-protected",
        defense: 8,
      }),
      offer(setup, "agenda", {
        root: "root:agenda",
        milestone: "agenda-installed",
        agendaProgress: 10,
      }),
    ];
    const first = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers,
    });
    const reversed = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [...offers].reverse(),
    });

    expect(reversed).toEqual(first);
    expect(first.protectedPartitionKeys).toHaveLength(3);
    expect(first.conservativeBaselineLineIds).toHaveLength(3);
    expect(first.evidenceCodes).toContain("beam_search_not_used");
  });

  it("keeps follow-up-only offers out of protected roots but admits them after their urgent head", () => {
    const setup = searchSetup();
    const urgent = offer(setup, "urgent-defense", {
      root: "root:defense",
      milestone: "central-protected",
      defense: 12,
    });
    const followup = offer(setup, "followup-credit", {
      root: "root:economy",
      milestone: "reserve-restored",
      economy: 4,
      dependencyCandidateIds: [urgent.head.candidateId],
      rootEligible: false,
    });
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [followup, urgent],
    });

    expect(result.protectedPartitionKeys).toHaveLength(1);
    expect(result.protectedPartitionKeys[0]).toContain("root:defense");
    expect(
      result.lines.some(
        (line) =>
          line.steps[0]?.candidateId === urgent.head.candidateId &&
          line.steps[1]?.candidateId === followup.head.candidateId,
      ),
    ).toBe(true);
    expect(
      result.lines.some(
        (line) => line.steps[0]?.candidateId === followup.head.candidateId,
      ),
    ).toBe(false);
  });

  it("does not append a pre-known run to a selected Runner investment root", () => {
    const setup = searchSetup();
    const investment = offer(setup, "runner-investment", {
      root: "root:investment",
      milestone: "investment-installed",
      economy: 8,
      continuationScope: "same_root",
    });
    const ownFollowup = offer(setup, "runner-investment-followup", {
      root: "root:investment",
      milestone: "investment-held",
      economy: 4,
      continuationScope: "same_root",
    });
    const preKnownRun = offer(setup, "pre-known-run", {
      root: "root:pressure",
      milestone: "access-attempted",
      agendaProgress: 20,
    });
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [investment, ownFollowup, preKnownRun],
    });
    const investmentLines = result.lines.filter(
      (line) => line.steps[0]?.candidateId === investment.head.candidateId,
    );

    expect(
      investmentLines.some((line) =>
        line.steps.some(
          (step) => step.candidateId === preKnownRun.head.candidateId,
        ),
      ),
    ).toBe(false);
    expect(
      investmentLines.some(
        (line) => line.steps[1]?.candidateId === ownFollowup.head.candidateId,
      ),
    ).toBe(true);
  });

  it("keeps an exact Corp support step bound to its parent root", () => {
    const setup = searchSetup();
    const support = offer(setup, "score-defense-support", {
      root: "root:score",
      milestone: "score-server-protected",
      defense: 8,
      continuationScope: "same_root",
    });
    const scoreConversion = offer(setup, "score-agenda-install", {
      root: "root:score",
      milestone: "agenda-installed",
      agendaProgress: 10,
    });
    const unrelatedEconomy = offer(setup, "unrelated-economy-install", {
      root: "root:economy",
      milestone: "campaign-installed",
      economy: 20,
    });

    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [support, scoreConversion, unrelatedEconomy],
    });
    const supportLines = result.lines.filter(
      (line) => line.steps[0]?.candidateId === support.head.candidateId,
    );

    expect(
      supportLines.some(
        (line) =>
          line.steps[1]?.candidateId === scoreConversion.head.candidateId,
      ),
    ).toBe(true);
    expect(
      supportLines.some(
        (line) =>
          line.steps[1]?.candidateId === unrelatedEconomy.head.candidateId,
      ),
    ).toBe(false);
  });

  it("changes the head only when the bounded second step materially beats the single-step baseline", () => {
    const setup = searchSetup();
    const safeDefense = offer(setup, "safe-defense-baseline", {
      root: "root:defense",
      milestone: "central-protected",
      defense: 8,
    });
    const agendaSetup = offer(setup, "agenda-setup", {
      root: "root:agenda",
      milestone: "score-route-open",
      agendaProgress: 1,
    });
    const agendaConversion = offer(setup, "agenda-conversion", {
      root: "root:agenda",
      milestone: "agenda-scored",
      agendaProgress: 20,
      dependencyCandidateIds: [agendaSetup.head.candidateId],
      rootEligible: false,
    });
    const offers = [safeDefense, agendaSetup, agendaConversion];
    const singleStep = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers,
      budget: { maximumDepth: 1 },
    });
    const twoStep = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers,
      budget: { maximumDepth: 2 },
    });
    const selectedSingle = singleStep.lines.find(
      (line) => line.lineId === singleStep.selectedLineId,
    );
    const selectedTwoStep = twoStep.lines.find(
      (line) => line.lineId === twoStep.selectedLineId,
    );

    expect(selectedSingle?.steps[0]?.candidateId).toBe(
      safeDefense.head.candidateId,
    );
    expect(selectedTwoStep?.steps.map((step) => step.candidateId)).toEqual([
      agendaSetup.head.candidateId,
      agendaConversion.head.candidateId,
    ]);
    expect(selectedTwoStep?.scalarValue).toBeGreaterThan(
      selectedSingle?.scalarValue ?? Number.POSITIVE_INFINITY,
    );
  });

  it("keeps a low-value dependency bridge when a bounded third step can beat the partition floor", () => {
    const setup = searchSetup();
    const floor = offer(setup, "floor", {
      root: "root:agenda",
      milestone: "score-route",
      agendaProgress: 12,
    });
    const opener = offer(setup, "opener", {
      root: "root:agenda",
      milestone: "score-route",
      agendaProgress: 1,
    });
    const bridge = offer(setup, "bridge", {
      root: "root:agenda",
      milestone: "score-route",
      dependencyCandidateIds: [opener.head.candidateId],
      rootEligible: false,
    });
    const conversion = offer(setup, "conversion", {
      root: "root:agenda",
      milestone: "score-route",
      agendaProgress: 20,
      dependencyCandidateIds: [bridge.head.candidateId],
      rootEligible: false,
    });

    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [conversion, bridge, opener, floor],
      budget: { maximumDepth: 3 },
    });
    const selected = result.lines.find(
      (line) => line.lineId === result.selectedLineId,
    );

    expect(selected?.steps.map((step) => step.candidateId)).toEqual([
      opener.head.candidateId,
      bridge.head.candidateId,
      conversion.head.candidateId,
    ]);
    expect(selected?.scalarValue).toBe(21);
  });

  it("uses guaranteed restricted action capacity for a compatible follow-up", () => {
    const setup = searchSetup({ clicks: 1 });
    const capacity = offer(setup, "gain-install-actions", {
      root: "root:capacity",
      milestone: "capacity-created",
      flexibility: 2,
      actionType: "play_operation",
      semanticActionType: "score_conversion.gain_action_capacity",
      capacityProjection: restrictedInstallCapacity(),
    });
    const install = offer(setup, "install-agenda", {
      root: "root:agenda",
      milestone: "agenda-installed",
      agendaProgress: 30,
      actionType: "install_card",
      semanticActionType: "install.card",
      dependencyCandidateIds: [capacity.head.candidateId],
    });
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [install, capacity],
    });
    const combined = result.lines.find(
      (line) =>
        line.steps.length === 2 &&
        line.steps[0]?.candidateId === capacity.head.candidateId &&
        line.steps[1]?.candidateId === install.head.candidateId,
    );

    expect(combined).toBeDefined();
    expect(combined?.projectedFrame.actionCapacityLedger).toMatchObject({
      unrestricted: { minimum: 0, maximum: 0 },
      restrictedTokens: [
        {
          remaining: 2,
          allowedActionTypes: ["install_card"],
        },
      ],
    });
    expect(combined?.steps[0]?.currentBinding?.actionId).toBe(
      capacity.candidate.actionId,
    );
    expect(combined?.steps[1]?.currentBinding).toBeUndefined();
    expect(JSON.stringify(combined?.steps[1]?.invocation)).not.toContain(
      "actionId",
    );
  });

  it("projects the guaranteed basic credit contract as exact economy", () => {
    const setup = searchSetup({ credits: 5 });
    const basicCredit = offer(setup, "basic-credit", {
      root: "root:economy",
      milestone: "credit-gained",
      economy: 1,
      netCredits: 1,
    });
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [basicCredit],
      budget: { maximumDepth: 1 },
    });

    expect(result.lines[0]?.projectedFrame.ownCredits).toEqual({
      minimum: 6,
      maximum: 6,
    });
  });

  it("collapses only a certified commutative same-root order", () => {
    const setup = searchSetup();
    const first = offer(setup, "a", {
      root: "root:setup",
      milestone: "setup-ready",
      economy: 2,
      commutativeGroupKey: "independent-setup",
    });
    const second = offer(setup, "b", {
      root: "root:setup",
      milestone: "setup-ready",
      defense: 2,
      commutativeGroupKey: "independent-setup",
    });
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [second, first],
    });
    const twoStepOrders = result.lines
      .filter((line) => line.steps.length === 2)
      .map((line) => line.steps.map((step) => step.candidateId));

    expect(twoStepOrders).toContainEqual(["head:a", "head:b"]);
    expect(twoStepOrders).not.toContainEqual(["head:b", "head:a"]);
    expect(result.pruneEvents).toContainEqual(
      expect.objectContaining({
        candidateId: "head:a",
        reasonCode: "duplicate_commutative_order",
      }),
    );
  });

  it("expands every obligation-root-milestone partition before honoring a smaller global request", () => {
    const setup = searchSetup();
    const offers = ["a", "b", "c"].map((id) =>
      offer(setup, id, {
        root: `root:${id}`,
        milestone: `milestone:${id}`,
        obligationSignature: `obligation:${id}`,
        flexibility: 1,
      }),
    );
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers,
      budget: {
        maximumExpandedNodes: 1,
        maximumDepth: 1,
      },
    });

    expect(result.protectedPartitionKeys).toHaveLength(3);
    expect(result.expandedNodeCount).toBe(3);
    expect(result.budget.maximumExpandedNodes).toBe(3);
    expect(result.conservativeBaselineLineIds).toHaveLength(3);
  });

  it("keeps a conservative baseline while pruning a dominated representative", () => {
    const setup = searchSetup();
    const weak = offer(setup, "weak", {
      root: "root:defense",
      milestone: "central",
      defense: 2,
    });
    const strong = offer(setup, "strong", {
      root: "root:defense",
      milestone: "central",
      defense: 8,
    });
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [weak, strong],
      budget: { maximumDepth: 1 },
    });

    expect(result.conservativeBaselineLineIds).toHaveLength(1);
    expect(result.lines.some((line) => line.scalarValue === 8)).toBe(true);
    expect(result.pruneEvents).toContainEqual(
      expect.objectContaining({
        candidateId: "head:weak",
        reasonCode: "dominated_in_partition",
      }),
    );
  });

  it("uses a conservative upper bound to stop a hopeless second branch", () => {
    const setup = searchSetup();
    const floor = offer(setup, "floor", {
      root: "root:economy",
      milestone: "stable",
      economy: 12,
    });
    const weak = offer(setup, "weak-upper-bound", {
      root: "root:economy",
      milestone: "stable",
      flexibility: 1,
    });
    const harmful = offer(setup, "harmful", {
      root: "root:economy",
      milestone: "stable",
      risk: 8,
    });
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [harmful, weak, floor],
    });

    expect(result.pruneEvents).toContainEqual(
      expect.objectContaining({
        reasonCode: "upper_bound_below_partition_floor",
      }),
    );
  });

  it("stops at a real observation boundary and never invents its next action", () => {
    const setup = searchSetup();
    const draw = offer(setup, "draw", {
      root: "root:draw",
      milestone: "card-observed",
      handQuality: 4,
      boundaryAfter: assessTurnObservationBoundary({
        boundaryKind: "private_observation",
        remainingActionCapacity: { minimum: 2, maximum: 2 },
        residualTurnValueBasis: "hand_quality_distribution",
        immediateOutcomeCodes: ["draw_one_card"],
      }),
    });
    const followup = offer(setup, "followup", {
      root: "root:followup",
      milestone: "installed",
      flexibility: 8,
    });
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [draw, followup],
    });
    const drawLines = result.lines.filter(
      (line) => line.steps[0]?.candidateId === draw.head.candidateId,
    );

    expect(drawLines).not.toHaveLength(0);
    expect(drawLines.every((line) => line.steps.length === 1)).toBe(true);
    expect(drawLines[0]?.stopReason).toBe("observation_boundary");
  });

  it("also stops at a public random outcome before choosing the remainder", () => {
    const setup = searchSetup();
    const randomEconomy = offer(setup, "random-economy", {
      root: "root:economy",
      milestone: "random-income-observed",
      economy: 5,
      boundaryAfter: assessTurnObservationBoundary({
        boundaryKind: "public_random_outcome",
        remainingActionCapacity: { minimum: 2, maximum: 2 },
        residualTurnValueBasis: "public_outcome_distribution",
        immediateOutcomeCodes: ["random_income_observed"],
      }),
    });
    const followup = offer(setup, "random-followup", {
      root: "root:defense",
      milestone: "central-protected",
      defense: 8,
    });
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [randomEconomy, followup],
    });
    const randomLines = result.lines.filter(
      (line) => line.steps[0]?.candidateId === randomEconomy.head.candidateId,
    );

    expect(randomLines).not.toHaveLength(0);
    expect(randomLines.every((line) => line.steps.length === 1)).toBe(true);
    expect(randomLines[0]?.stopReason).toBe("observation_boundary");
  });

  it("prunes a two-step line that would count one exclusive payoff twice", () => {
    const setup = searchSetup();
    const first = offer(setup, "first-payoff-owner", {
      root: "root:agenda",
      milestone: "score-window-created",
      agendaProgress: 10,
      valueClaims: [exclusiveClaim("claim:first", "corp.score_agenda")],
    });
    const second = offer(setup, "second-payoff-owner", {
      root: "root:defense",
      milestone: "same-score-window-protected",
      defense: 8,
      valueClaims: [exclusiveClaim("claim:second", "corp.defend_servers")],
    });
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [first, second],
    });

    expect(result.pruneEvents).toContainEqual(
      expect.objectContaining({
        reasonCode: "conflicting_value_claim",
      }),
    );
    expect(result.lines.every((line) => line.steps.length === 1)).toBe(true);
  });

  it("fails closed on violated obligations, unknown capacity and stale bindings", () => {
    const setup = searchSetup();
    const violated = offer(setup, "violated", {
      root: "root:violated",
      milestone: "bad",
      priorityCoverage: coverage({
        required: ["protect-hq"],
        violated: ["protect-hq"],
      }),
    });
    const randomCapacity = offer(setup, "random-capacity", {
      root: "root:capacity",
      milestone: "unknown",
      capacityProjection: {
        ...restrictedInstallCapacity(),
        reliability: "random",
      },
    });
    const stale = offer(setup, "stale", {
      root: "root:stale",
      milestone: "stale",
    });
    stale.candidate.stateVersion = 9;
    const unknownCost = offer(setup, "unknown-cost", {
      root: "root:cost",
      milestone: "unknown",
    });
    unknownCost.candidate.costProfile = {
      ...unknownCost.candidate.costProfile,
      costKnownStatus: "unknown",
    };
    const result = searchDeterministicRemainderTurnPlans({
      entryFrame: setup.frame,
      offers: [violated, randomCapacity, stale, unknownCost],
    });

    expect(result.lines).toEqual([]);
    expect(result.pruneEvents.map((event) => event.reasonCode)).toEqual(
      expect.arrayContaining([
        "priority_obligation_violated",
        "capacity_projection_not_guaranteed",
        "candidate_binding_mismatch",
        "candidate_cost_not_exact",
      ]),
    );
  });
});

function searchSetup(overrides: { clicks?: number; credits?: number } = {}) {
  const input = decisionInput(overrides);
  const stateIdentity = buildPlanningStateIdentity(input);
  const rulesContext = buildPlanningRulesContext({
    rulesBaseline: CURRENT_RULES_BASELINE,
    formatProfileId: "turn-search-test",
    cardPoolSnapshotId: "turn-search-test",
  });
  return {
    input,
    stateIdentity,
    frame: buildProjectedDecisionFrame({
      input,
      rulesContext,
      stateIdentity,
      turnKey: "corp:1",
      handDispositions: new Map(
        input.playerView.own.gripOrHq.map((card) => [
          card.instanceId,
          "current_plan_route" as const,
        ]),
      ),
    }),
  };
}

function offer(
  setup: ReturnType<typeof searchSetup>,
  id: string,
  params: {
    root: string;
    milestone: string;
    obligationSignature?: string;
    agendaProgress?: number;
    defense?: number;
    economy?: number;
    handQuality?: number;
    flexibility?: number;
    risk?: number;
    netCredits?: number;
    actionType?: string;
    semanticActionType?: string;
    capacityProjection?: ActionCapacityProjection;
    dependencyCandidateIds?: string[];
    rootEligible?: boolean;
    commutativeGroupKey?: string;
    boundaryAfter?: TurnRemainderSearchOffer["boundaryAfter"];
    priorityCoverage?: PriorityCoverage;
    valueClaims?: CampaignValueClaim[];
    continuationScope?: TurnRemainderSearchOffer["continuationScope"];
  },
): TurnRemainderSearchOffer {
  const candidateId = `head:${id}`;
  const actionId = `action:${id}`;
  const sourceCardInstanceId = `card:${id}`;
  const semanticActionType = params.semanticActionType ?? "economy.gain_credit";
  const invocation = buildCanonicalLegalActionInvocation({
    stateIdentity: setup.stateIdentity,
    semanticActionType,
    sourceCardInstanceId,
  });
  const evaluationValues = {
    ...(params.agendaProgress
      ? { agenda_progress: params.agendaProgress }
      : {}),
    ...(params.defense ? { defense: params.defense } : {}),
    ...(params.economy ? { economy: params.economy } : {}),
    ...(params.handQuality ? { hand_quality: params.handQuality } : {}),
    ...(params.flexibility ? { flexibility: params.flexibility } : {}),
    ...(params.risk ? { risk: params.risk } : {}),
  };
  const head: TurnPlanningHeadCandidate = {
    candidateId,
    side: "corp",
    moduleId: moduleForRoot(params.root),
    rootPlanInstanceId: params.root,
    nextMilestoneId: params.milestone,
    stepFingerprint: `step:${id}`,
    horizonCapability: "current_turn_only",
    instanceHorizon: "current_turn",
    priorityClass: "P4",
    invocation,
    currentBinding: {
      actionId,
      stateVersion: setup.stateIdentity.stateVersion,
      semanticActionSetFingerprint: "semantic-actions:test",
      invocationKey: invocation.invocationKey,
    },
    executableWitness: {
      stateVersion: setup.stateIdentity.stateVersion,
      sideSafePlanningFingerprint:
        setup.stateIdentity.sideSafePlanningFingerprint,
      semanticActionSetFingerprint: "semantic-actions:test",
      stepFingerprint: `step:${id}`,
      invocationKey: invocation.invocationKey,
      quoteIds: [],
      safetyPolicyVersion: "turn-search-test-v1",
      allRouteDefiningChoicesBound: true,
    },
    evaluationValues,
    valueClaims: params.valueClaims ?? [],
    evidenceCodes: [`offer:${id}`],
  };
  const candidate: ActionSemanticCandidate = {
    actionId,
    actionType: params.actionType ?? "gain_credit",
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType: params.actionType ?? "gain_credit",
      originalPayloadKeys: [],
    },
    stateVersion: setup.stateIdentity.stateVersion,
    sourceKind: "card",
    sourceCardInstanceId,
    sourceDefinitionId: `definition:${id}`,
    abilityBindingMethod: "unresolved",
    semanticActionType,
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: setup.stateIdentity.stateVersion,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    actionCapacityProjection:
      params.capacityProjection ?? regularActionCapacity(),
    ...(params.netCredits !== undefined
      ? {
          economyProjection: {
            schemaVersion: "action-economy-projection-v1" as const,
            kind: "immediate_liquid" as const,
            timing: "immediate" as const,
            creditRestriction: "general" as const,
            clickCost: 1,
            creditCost: 0,
            grossLiquidCreditGain: params.netCredits,
            netLiquidCreditGain: params.netCredits,
            cardsDrawn: 0,
            cardsConsumed: 0,
            netHandDelta: 0,
            payoutMode: "fixed" as const,
            repeatable: true,
            reliability: "guaranteed" as const,
            source: "basic_action_contract" as const,
            confidence: "medium" as const,
            evidence: [],
          },
        }
      : {}),
    hardGates: [],
    evidence: [],
  };
  return {
    head,
    candidate,
    obligationSignature: params.obligationSignature ?? "obligation:none",
    priorityCoverage: params.priorityCoverage ?? coverage(),
    ...(params.continuationScope
      ? { continuationScope: params.continuationScope }
      : {}),
    ...(params.dependencyCandidateIds
      ? { dependencyCandidateIds: params.dependencyCandidateIds }
      : {}),
    ...(params.rootEligible !== undefined
      ? { rootEligible: params.rootEligible }
      : {}),
    ...(params.commutativeGroupKey
      ? {
          commutativeGroupKey: params.commutativeGroupKey,
          commutativityCertified: true,
        }
      : {}),
    ...(params.boundaryAfter ? { boundaryAfter: params.boundaryAfter } : {}),
  };
}

function exclusiveClaim(
  claimId: string,
  ownerModuleId: CampaignValueClaim["ownerModuleId"],
): CampaignValueClaim {
  return {
    claimId,
    campaignId: "campaign:test",
    ownerModuleId,
    objectiveKey: "score-window",
    componentKey: "score_window_progress",
    evaluationDimensionId: "agenda_progress",
    aggregationMode: "exclusive",
    contributionKind: "objective_payoff",
    beforeQuoteId: "quote:before",
    afterQuoteId: "quote:after",
    amount: 10,
    dependencyKeys: [],
    conflictKeys: ["score-window-payoff"],
    status: "quoted",
  };
}

function moduleForRoot(root: string): TurnPlanningHeadCandidate["moduleId"] {
  if (root.includes("agenda")) return "corp.score_agenda";
  if (root.includes("defense")) return "corp.defend_servers";
  return "corp.economy";
}

function regularActionCapacity(): ActionCapacityProjection {
  return {
    schemaVersion: "action-capacity-projection-v1",
    kind: "non_action_capacity",
    timing: "immediate",
    restriction: "unrestricted",
    allowedActionTypes: [],
    listedActionCost: 1,
    preExistingActionCost: 1,
    grossActionsGained: 0,
    generatedActionsConsumedByCurrentAction: 0,
    followupActionCapacity: 0,
    netCurrentTurnActionDelta: -1,
    actionDebt: 0,
    selfFinancing: false,
    repeatable: false,
    reliability: "guaranteed",
    source: "legal_action_payload",
    confidence: "high",
    evidence: [],
  };
}

function restrictedInstallCapacity(): ActionCapacityProjection {
  return {
    schemaVersion: "action-capacity-projection-v1",
    kind: "immediate_restricted_gain",
    timing: "immediate",
    restriction: "install_only",
    allowedActionTypes: ["install_card"],
    listedActionCost: 1,
    preExistingActionCost: 1,
    grossActionsGained: 3,
    generatedActionsConsumedByCurrentAction: 0,
    followupActionCapacity: 3,
    netCurrentTurnActionDelta: 2,
    actionDebt: 0,
    expiresAt: "side_turn_end",
    selfFinancing: false,
    repeatable: false,
    reliability: "guaranteed",
    source: "legal_action_payload",
    confidence: "high",
    evidence: [],
  };
}

function coverage(
  params: {
    required?: string[];
    satisfied?: string[];
    violated?: string[];
    deferred?: string[];
  } = {},
): PriorityCoverage {
  return {
    requiredObligationIds: params.required ?? [],
    satisfiedObligationIds: params.satisfied ?? [],
    violatedObligationIds: params.violated ?? [],
    deferredObligationIds: params.deferred ?? [],
  };
}

function decisionInput(overrides: {
  clicks?: number;
  credits?: number;
}): AiDecisionInput {
  const hand = Array.from({ length: 12 }, (_, index) =>
    card(`card:${String.fromCharCode(97 + index)}`, "operation"),
  );
  return {
    side: "corp",
    difficulty: "hard",
    profileId: "turn-search-test",
    seed: "turn-search-test",
    decisionId: "turn-search-test",
    actionNumber: 10,
    eventTail: [],
    playerView: {
      side: "corp",
      stateVersion: 10,
      turnSerial: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "action",
      own: {
        identity: card("corp-id", "identity"),
        credits: overrides.credits ?? 5,
        clicks: overrides.clicks ?? 3,
        agendaPoints: 0,
        gripOrHq: hand,
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 12,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", "identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 40,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
      ],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function card(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
): VisibleCard {
  return {
    instanceId,
    definitionId: `${instanceId}-definition`,
    title: instanceId,
    type,
    known: true,
    owner: "corp",
    controller: "corp",
  };
}
