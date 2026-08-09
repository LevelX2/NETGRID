import {
  CURRENT_RULES_BASELINE,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  assertCanonicalLegalActionInvocation,
  assertPlanningRulesContext,
  assertTurnPlan,
  assertTurnPlanningHeadCandidate,
  buildCanonicalLegalActionInvocation,
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
  PLAN_COMMITMENT_PRECEDENCE,
  TURN_PLAN_EVALUATION_REGISTRY,
  TURN_PLAN_EVALUATION_REGISTRY_VERSION,
  TURN_PLANNING_CONTRACT_SCHEMA_VERSION,
  turnPlanningFingerprint,
  type CampaignValueClaim,
  type CurrentLegalActionBinding,
  type PlanningStateIdentity,
  type TurnPlan,
  type TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";

describe("turn planning contracts", () => {
  it("binds the complete rules and planner policy independently of state", () => {
    const first = rulesContext();
    const second = rulesContext();

    expect(first).toEqual(second);
    expect(first.fingerprint).toMatch(/^fnv1a:/);
    expect(first.cardRegistryRulesContext.engineSchemaVersion).toBe(
      CURRENT_RULES_BASELINE.engineSchemaVersion,
    );
    expect(() => assertPlanningRulesContext(first)).not.toThrow();
    expect(() =>
      assertPlanningRulesContext({
        ...first,
        cardRegistryRulesContext: {
          ...first.cardRegistryRulesContext,
          cardPoolSnapshotId: "different-pool",
        },
      }),
    ).toThrowError(/rules_fingerprint_mismatch/);
  });

  it("keeps text provenance outside the mechanical planning-rules context", () => {
    const changedTextBaseline = {
      ...CURRENT_RULES_BASELINE,
      cardTextSnapshotId: "text-only-change",
    } as unknown as typeof CURRENT_RULES_BASELINE;
    const changed = buildPlanningRulesContext({
      rulesBaseline: changedTextBaseline,
      formatProfileId: "test-format",
      cardPoolSnapshotId: "test-pool",
    });
    expect(changed.fingerprint).toBe(rulesContext().fingerprint);
  });

  it("rejects a forged nested CardRegistry context even with a refreshed outer hash", () => {
    const forged = structuredClone(rulesContext());
    forged.cardRegistryContext.rulesContextFingerprint =
      "fnv1a64x2:forged:0000000000000000";
    const { fingerprint: _fingerprint, ...input } = forged;
    forged.fingerprint = turnPlanningFingerprint("planning-rules", input);
    expect(() => assertPlanningRulesContext(forged)).toThrowError(
      /card_registry_context_invalid|card_registry_rules_context_mismatch/,
    );
  });

  it.each([
    ["cardRegistryContext", undefined],
    ["cardRegistryContext", null],
    ["cardRegistryContext", "invalid"],
    ["cardRegistryRulesContext", undefined],
    ["cardRegistryRulesContext", null],
    ["cardRegistryRulesContext", "invalid"],
  ])(
    "rejects a missing or non-object nested CardRegistry context",
    (field, invalid) => {
      const context = rulesContext() as unknown as Record<string, unknown>;
      context[field] = invalid;
      expect(() =>
        assertPlanningRulesContext(
          context as unknown as ReturnType<typeof rulesContext>,
        ),
      ).toThrowError(/card_registry_context_invalid/);
    },
  );

  it("derives identical planner identity from hidden-equivalent safe inputs", () => {
    const first = decisionInput();
    const second = structuredClone(first);
    second.legalActions = [...second.legalActions].reverse();
    second.legalActions[0]!.actionId = "different-ephemeral-action-id";
    second.playerView.legalActions[0]!.actionId =
      "different-ephemeral-action-id";

    expect(buildPlanningStateIdentity(first)).toEqual(
      buildPlanningStateIdentity(second),
    );
  });

  it("changes planner identity when actor-visible state changes", () => {
    const first = decisionInput();
    const second = structuredClone(first);
    second.playerView.own.credits += 1;

    expect(
      buildPlanningStateIdentity(first).sideSafePlanningFingerprint,
    ).not.toBe(buildPlanningStateIdentity(second).sideSafePlanningFingerprint);
  });

  it("permits concrete card, server and ability references but no future actionId", () => {
    const identity = stateIdentity();
    const invocation = buildCanonicalLegalActionInvocation({
      stateIdentity: identity,
      semanticActionType: "install.card",
      sourceCardInstanceId: "corp_ice_1",
      sourceAbilityId: "install",
      boundTargets: [
        {
          slotId: "server",
          ordering: "single",
          values: [{ kind: "server", id: "rd" }],
        },
        {
          slotId: "card",
          ordering: "single",
          values: [{ kind: "card", id: "corp_ice_1", label: "Known ICE" }],
        },
        {
          slotId: "ability",
          ordering: "single",
          values: [
            {
              kind: "ability",
              id: "corp_ice_1:rez",
              sourceCardInstanceId: "corp_ice_1",
              abilityId: "rez",
            },
          ],
        },
      ],
    });

    expect(() =>
      assertCanonicalLegalActionInvocation(invocation, identity),
    ).not.toThrow();
    expect(() =>
      assertCanonicalLegalActionInvocation({
        ...invocation,
        actionId: "future-action",
      } as never),
    ).toThrowError(/future_action_id_forbidden/);
  });

  it("canonicalizes unordered targets and binds route-defining choices", () => {
    const identity = stateIdentity();
    const first = buildCanonicalLegalActionInvocation({
      stateIdentity: identity,
      semanticActionType: "trash.resources",
      boundTargets: [
        {
          slotId: "targets",
          ordering: "unordered",
          values: [
            { kind: "card", id: "b" },
            { kind: "card", id: "a" },
          ],
        },
      ],
      boundChoices: [
        {
          choiceId: "amount",
          role: "route_defining",
          value: { kind: "number", value: 2 },
        },
      ],
    });
    const second = buildCanonicalLegalActionInvocation({
      stateIdentity: identity,
      semanticActionType: "trash.resources",
      boundTargets: [
        {
          slotId: "targets",
          ordering: "unordered",
          values: [
            { kind: "card", id: "a" },
            { kind: "card", id: "b" },
          ],
        },
      ],
      boundChoices: [
        {
          choiceId: "amount",
          role: "route_defining",
          value: { kind: "number", value: 2 },
        },
      ],
    });

    expect(first).toEqual(second);
  });

  it("requires current binding and executable witness to match the invocation", () => {
    const candidate = head();
    expect(() =>
      assertTurnPlanningHeadCandidate(candidate, stateIdentity()),
    ).not.toThrow();

    candidate.currentBinding.invocationKey = "wrong";
    expect(() =>
      assertTurnPlanningHeadCandidate(candidate, stateIdentity()),
    ).toThrowError(/binding_invocation_mismatch/);
  });

  it("requires every multi-turn instance to quote a line-bound campaign", () => {
    const candidate = head();
    candidate.instanceHorizon = "multi_turn";
    candidate.horizonCapability = "context_dependent";

    expect(() =>
      assertTurnPlanningHeadCandidate(candidate, stateIdentity()),
    ).toThrowError(/multi_turn_instance_without_campaign_quote/);
    candidate.campaignQuote = {
      quoteId: "quote-score-install",
      campaignId: "score-campaign",
      quoteVersion: "v1",
      basis: {
        kind: "projected_frame",
        baseStateVersion: 10,
        projectedFrameKey: "after-install",
        linePrefixHash: "line-prefix-install",
      },
      currentMilestoneId: "install",
      nextMilestoneId: "advance",
      commitment: "hard",
      remainingValue: 80,
      expiresAt: "next_own_turn",
      revalidationCodes: ["agenda_still_installed"],
    };
    expect(() =>
      assertTurnPlanningHeadCandidate(candidate, stateIdentity()),
    ).not.toThrow();
  });

  it("allows ordered resident root phases with exact support bindings", () => {
    const plan = turnPlan();
    const secondInvocation = invocation("install.card", [
      { kind: "server", id: "rd" },
    ]);
    plan.phases[0]!.transition = {
      kind: "next_bound_phase",
      nextPhaseId: "phase-defense",
      reasonCode: "agenda_phase_complete",
      resourceHandoffIds: [],
    };
    plan.phases.push({
      phaseId: "phase-defense",
      root: {
        planInstanceId: "defense",
        moduleId: "corp.defend_servers",
        milestoneId: "protect-rd",
        provenance: "resident",
      },
      rootAssessmentFingerprint: "assessment-defense",
      entryFrameKey: "after-agenda",
      entryConditions: [{ code: "agenda_phase_complete" }],
      completionCondition: { code: "rd_ice_installed" },
      supportLeaves: [],
      nodes: [
        {
          nodeId: "install-rd",
          invocation: secondInvocation,
          expectedStateDeltaCodes: ["ice_installed:rd"],
        },
      ],
      protectedValueClaimIds: [],
      transition: { kind: "turn_end" },
    });

    expect(() =>
      assertTurnPlan(plan, rulesContext(), stateIdentity()),
    ).not.toThrow();
  });

  it("rejects broken phase transitions and support leaves without assignments", () => {
    const plan = turnPlan();
    plan.phases[0]!.transition = {
      kind: "next_bound_phase",
      nextPhaseId: "missing",
      reasonCode: "continue",
      resourceHandoffIds: [],
    };
    plan.phases[0]!.supportLeaves[0]!.assignmentId = "";

    expect(() =>
      assertTurnPlan(plan, rulesContext(), stateIdentity()),
    ).toThrowError(
      /phase_transition_target_mismatch|support_without_assignment/,
    );
  });

  it("ends a concrete plan at the first true uncertainty boundary", () => {
    const plan = turnPlan();
    plan.phases[0]!.nodes[0]!.boundaryAfter = "private_observation";
    plan.phases[0]!.nodes.push({
      nodeId: "illegal-after-draw",
      invocation: invocation("install.card"),
      expectedStateDeltaCodes: [],
    });

    expect(() =>
      assertTurnPlan(plan, rulesContext(), stateIdentity()),
    ).toThrowError(/node_after_uncertainty_boundary/);
  });

  it("rejects violated duties and invalid P3 deferral", () => {
    const plan = turnPlan();
    plan.priorityObligations = [
      {
        obligationId: "protect-rd",
        priorityClass: "P3",
        activatedAtFrameKey: "frame-1",
        deadline: "turn_end",
        satisfactionCondition: { code: "rd_protected" },
        deferrable: false,
        witnessId: "defense-assessment",
        guarantee: "guaranteed",
      },
    ];
    plan.priorityCoverage = {
      requiredObligationIds: ["protect-rd"],
      satisfiedObligationIds: [],
      violatedObligationIds: ["protect-rd"],
      deferredObligationIds: ["protect-rd"],
    };

    expect(() =>
      assertTurnPlan(plan, rulesContext(), stateIdentity()),
    ).toThrowError(/invalid_deferred_obligation|violated_priority_obligation/);
  });

  it("rejects exclusive cross-campaign double counting and numerical priority", () => {
    const plan = turnPlan();
    plan.campaignValueClaims = [
      claim("claim-a", "campaign-a", "corp.score_agenda"),
      claim("claim-b", "campaign-b", "corp.economy"),
    ];

    expect(() =>
      assertTurnPlan(plan, rulesContext(), stateIdentity()),
    ).toThrowError(/campaign_value_double_count/);
    expect(
      TURN_PLAN_EVALUATION_REGISTRY.dimensions.map(
        (dimension) => dimension.dimensionId,
      ),
    ).not.toContain("priority");
    const candidate = head();
    candidate.evaluationValues = { priority: 1 };
    expect(() =>
      assertTurnPlanningHeadCandidate(candidate, stateIdentity()),
    ).toThrowError(/unknown_evaluation_dimension:priority/);
  });

  it("fixes the approved commitment hierarchy", () => {
    expect(PLAN_COMMITMENT_PRECEDENCE).toEqual([
      "engine",
      "hard_plan_commitment",
      "turn_plan_commitment",
      "persistence_hysteresis",
    ]);
  });
});

function rulesContext() {
  return buildPlanningRulesContext({
    rulesBaseline: CURRENT_RULES_BASELINE,
    formatProfileId: "test-format",
    cardPoolSnapshotId: "test-pool",
  });
}

function stateIdentity(): PlanningStateIdentity {
  return {
    stateVersion: 10,
    sideSafePlanningFingerprint: "fnv1a:actor-safe",
  };
}

function invocation(
  semanticActionType = "economy.gain_credit",
  targets: Array<{ kind: "server" | "card"; id: string }> = [],
) {
  return buildCanonicalLegalActionInvocation({
    stateIdentity: stateIdentity(),
    semanticActionType,
    boundTargets:
      targets.length > 0
        ? [
            {
              slotId: "target",
              ordering: targets.length === 1 ? "single" : "ordered",
              values: targets,
            },
          ]
        : [],
  });
}

function currentBinding(invocationKey: string): CurrentLegalActionBinding {
  return {
    actionId: "legal-action-current-state",
    stateVersion: 10,
    semanticActionSetFingerprint: "fnv1a:current-actions",
    invocationKey,
  };
}

function head(): TurnPlanningHeadCandidate {
  const currentInvocation = invocation("install.card");
  return {
    candidateId: "agenda-head",
    side: "corp",
    moduleId: "corp.score_agenda",
    rootPlanInstanceId: "agenda-root",
    nextMilestoneId: "install",
    stepFingerprint: "step-install-agenda",
    horizonCapability: "campaign_capable",
    instanceHorizon: "current_turn",
    priorityClass: "P4",
    invocation: currentInvocation,
    currentBinding: currentBinding(currentInvocation.invocationKey),
    executableWitness: {
      stateVersion: 10,
      sideSafePlanningFingerprint: "fnv1a:actor-safe",
      semanticActionSetFingerprint: "fnv1a:current-actions",
      stepFingerprint: "step-install-agenda",
      invocationKey: currentInvocation.invocationKey,
      quoteIds: [],
      safetyPolicyVersion: "v1",
      allRouteDefiningChoicesBound: true,
    },
    evaluationValues: {
      agenda_progress: 20,
    },
    valueClaims: [],
    evidenceCodes: ["test"],
  };
}

function turnPlan(): TurnPlan {
  const currentInvocation = invocation();
  return {
    schemaVersion: TURN_PLANNING_CONTRACT_SCHEMA_VERSION,
    planId: "corp-turn-1",
    side: "corp",
    turnKey: "corp:1",
    stateIdentity: stateIdentity(),
    planningRulesFingerprint: rulesContext().fingerprint,
    evaluationRegistryVersion: TURN_PLAN_EVALUATION_REGISTRY_VERSION,
    phases: [
      {
        phaseId: "phase-agenda",
        root: {
          planInstanceId: "agenda",
          moduleId: "corp.score_agenda",
          milestoneId: "install",
          provenance: "resident",
        },
        rootAssessmentFingerprint: "assessment-agenda",
        entryFrameKey: "frame-1",
        entryConditions: [{ code: "agenda_in_hq" }],
        completionCondition: { code: "agenda_installed" },
        supportLeaves: [
          {
            planInstanceId: "economy",
            moduleId: "corp.economy",
            parentNeedId: "fund-agenda",
            assignmentId: "assignment-fund-agenda",
          },
        ],
        nodes: [
          {
            nodeId: "gain-credit",
            invocation: currentInvocation,
            executionBinding: currentBinding(currentInvocation.invocationKey),
            expectedStateDeltaCodes: ["credits:+1", "clicks:-1"],
          },
        ],
        protectedValueClaimIds: [],
        transition: { kind: "turn_end" },
      },
    ],
    cursor: { phaseIndex: 0, nodeIndex: 0 },
    priorityObligations: [],
    priorityCoverage: {
      requiredObligationIds: [],
      satisfiedObligationIds: [],
      violatedObligationIds: [],
      deferredObligationIds: [],
    },
    campaignValueClaims: [],
  };
}

function claim(
  claimId: string,
  campaignId: string,
  ownerModuleId: "corp.score_agenda" | "corp.economy",
): CampaignValueClaim {
  return {
    claimId,
    campaignId,
    ownerModuleId,
    objectiveKey: "score-window:agenda-1:remote-1",
    componentKey: "objective-payoff",
    evaluationDimensionId: "agenda_progress",
    aggregationMode: "exclusive",
    contributionKind: "objective_payoff",
    beforeQuoteId: "before",
    afterQuoteId: "after",
    amount: 30,
    dependencyKeys: [],
    conflictKeys: [],
    status: "quoted",
  };
}

function decisionInput(): AiDecisionInput {
  const legalAction = {
    actionId: "state-10-action-1",
    side: "corp",
    type: "gain_credit",
    label: "Gain 1 credit",
    source: "basic_action",
    timingPoint: "test.corp_action",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 10,
  } as unknown as LegalAction;
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 10,
      activeSide: "corp",
      phase: "corp_action",
      timingPoint: "test.corp_action",
      own: {
        identity: {
          instanceId: "corp-identity",
          definitionId: "corp-identity",
          title: "Corp",
          side: "corp",
          type: "identity",
          owner: "corp",
          controller: "corp",
          zone: "corp_identity",
          faceup: true,
          known: true,
          counters: {},
          advancement: 0,
        },
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 40,
        heapOrArchives: [],
        scored: [],
        rigOrServers: [],
        tags: 0,
        coreDamage: 0,
        badPublicity: 0,
        maxHandSize: 5,
      },
      opponent: {
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        gripOrHqCount: 5,
        stackOrRdCount: 40,
        heapOrArchives: [],
        scored: [],
        rigOrServers: [],
        tags: 0,
        coreDamage: 0,
        badPublicity: 0,
        maxHandSize: 5,
      },
      publicEvents: [],
      legalActions: [legalAction],
    },
    eventTail: [],
    legalActions: [legalAction],
    difficulty: "normal",
    seed: "not-used-by-planning-fingerprint",
    decisionId: "decision-10",
    actionNumber: 10,
    profileId: "corp-test",
  } as unknown as AiDecisionInput;
}
