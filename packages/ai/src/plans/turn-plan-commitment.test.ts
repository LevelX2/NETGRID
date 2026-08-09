import {
  CURRENT_RULES_BASELINE,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "../input-dto";
import { playerView } from "../semantic-ai-runtime-cutover.test-support";

import {
  advanceTurnPlanCommitment,
  certifyCurrentTurnCompletion,
  createTurnPlanCommitment,
  executionExpectationFromLegalAction,
  assertTurnPlanCommitment,
  invalidateTurnPlanCommitmentForRestart,
  rematerializeCommittedTurnStep,
  TurnPlanCommitmentError,
  validateCommittedTurnPhaseEntry,
  type TurnPlanContinuationEvidence,
} from "./turn-plan-commitment";
import {
  buildCanonicalLegalActionInvocation,
  buildPlanningRulesContext,
  buildSemanticActionSetFingerprint,
  TURN_PLAN_EVALUATION_REGISTRY_VERSION,
  TURN_PLANNING_CONTRACT_SCHEMA_VERSION,
  type CampaignValueClaim,
  type PlanningStateIdentity,
  type TurnPlan,
  type TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";

describe("turn plan commitment", () => {
  it("stores semantic routes without future action ids and rematerializes the current one", () => {
    const setup = scenario();
    const commitment = createCommitment(setup);

    expect(JSON.stringify(commitment)).not.toContain("actionId");
    expect(commitment).not.toHaveProperty("currentLeafExecutorInstanceId");
    const materialized = rematerializeCommittedTurnStep({
      commitment,
      rulesContext: setup.rules,
      runtimeInstanceId: "runtime:a",
      turnKey: "corp:1",
      stateIdentity: identity(10, "safe:10"),
      heads: [head(setup.plan, setup.firstAction, identity(10, "safe:10"))],
      legalActions: [setup.firstAction],
      continuationEvidence: validContinuationEvidence(),
    });

    expect(materialized.kind).toBe("executable");
    if (materialized.kind !== "executable") return;
    expect(materialized.lease.currentBinding.actionId).toBe("action:credit:10");
    expect(materialized.lease.nodeId).toBe("node:credit");
    expect(materialized.lease.routeKey).toBe(
      commitment.phases[0]!.nodes[0]!.invocation.routeKey,
    );
  });

  it("rematerializes a canonical capability only from one exact current LegalAction", () => {
    const setup = scenario();
    const rawCanonicalAction: LegalAction = {
      ...setup.firstAction,
      actionId: "action:canonical:10",
      source: "card:source",
      payload: {
        cardId: "card:source",
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityId: "test_card:gain",
        cardImplementationAbilityKey: "gain",
      },
      abilityRef: {
        sourceCardInstanceId: "card:source",
        sourceAbilityId: "test_card:gain",
      },
    };
    const canonicalAction = buildAiDecisionInputDto({
      side: "corp",
      playerView: playerView("corp", [rawCanonicalAction]),
      eventTail: [],
      legalActions: [rawCanonicalAction],
      difficulty: "normal",
      seed: "canonical-rematerialization",
      decisionId: "canonical-rematerialization:corp:10",
      actionNumber: 10,
      profileId: "canonical-rematerialization-test",
    }).legalActions[0]!;
    const invocation = buildCanonicalLegalActionInvocation({
      stateIdentity: identity(10, "safe:10"),
      semanticActionType: "economy.gain_credit",
      sourceCardInstanceId: "card:source",
      sourceAbilityBinding: {
        kind: "card_spec_capability_key",
        sourceAbilityId: "test_card:gain",
      },
    });
    setup.firstAction = canonicalAction;
    setup.plan.phases[0]!.nodes[0]!.invocation = invocation;
    setup.plan.phases[0]!.nodes[0]!.executionBinding = binding(
      canonicalAction,
      invocation.invocationKey,
    );
    const commitment = createCommitment(setup);
    const currentHead = head(
      setup.plan,
      canonicalAction,
      identity(10, "safe:10"),
    );
    currentHead.rootPlanModuleId = "corp.economy";
    currentHead.executorPlanInstanceId = "executor:canonical";
    currentHead.executorParentPlanInstanceId = "root:economy";
    currentHead.executorParentNeedId = "need:canonical";
    const execute = (legalActions: LegalAction[]) =>
      rematerializeCommittedTurnStep({
        commitment,
        rulesContext: setup.rules,
        runtimeInstanceId: "runtime:a",
        turnKey: "corp:1",
        stateIdentity: identity(10, "safe:10"),
        heads: [currentHead],
        legalActions,
        continuationEvidence: validContinuationEvidence(),
      });
    const exact = execute([canonicalAction]);
    expect(exact).toMatchObject({
      kind: "executable",
      lease: {
        nodeId: "node:credit",
        sourcePlanId: setup.plan.planId,
        actionType: canonicalAction.type,
      },
      head: {
        rootPlanInstanceId: currentHead.rootPlanInstanceId,
        rootPlanModuleId: currentHead.rootPlanModuleId,
        executorPlanInstanceId: currentHead.executorPlanInstanceId,
        executorParentPlanInstanceId: currentHead.executorParentPlanInstanceId,
        executorParentNeedId: currentHead.executorParentNeedId,
      },
    });
    expect(
      execute([canonicalAction, structuredClone(canonicalAction)]),
    ).toMatchObject({
      kind: "replan_required",
      reason: "current_step_not_legal",
    });
    const wrongPayload = structuredClone(canonicalAction);
    wrongPayload.payload!.cardImplementationAbilityKey = "other";
    expect(execute([wrongPayload])).toMatchObject({
      kind: "replan_required",
      reason: "current_step_not_legal",
    });
    for (const wrong of [
      { ...canonicalAction, side: "runner" as const },
      { ...canonicalAction, expiresAtStateVersion: 11 },
      { ...canonicalAction, source: "other-source" },
      {
        ...canonicalAction,
        abilityRef: {
          sourceCardInstanceId: "other-source",
          sourceAbilityId: "test_card:gain",
        },
      },
    ]) {
      expect(execute([wrong])).toMatchObject({
        kind: "replan_required",
        reason: "current_step_not_legal",
      });
    }
  });

  it("rejects future action ids and full GameState hashes in persisted commitments", () => {
    const setup = scenario();
    const commitment = createCommitment(setup);

    expect(() =>
      assertTurnPlanCommitment({
        ...commitment,
        actionId: "future-action",
      } as never),
    ).toThrowError(/future_action_id_forbidden/);
    expect(() =>
      assertTurnPlanCommitment({
        ...commitment,
        gameStateHash: "private-full-state-hash",
      } as never),
    ).toThrowError(/full_state_hash_forbidden/);
  });

  it("keeps expected progression and rematerializes the next step with its new action id", () => {
    const setup = scenario({ samePhase: true });
    const commitment = createCommitment(setup);
    const first = executableLease(
      commitment,
      setup,
      setup.firstAction,
      identity(10, "safe:10"),
    );
    const advanced = advanceTurnPlanCommitment(commitment, {
      lease: first.lease,
      runtimeInstanceId: "runtime:a",
      turnKey: "corp:1",
      stateIdentityAfter: identity(11, "safe:11"),
      outcomeCodes: ["credits:+1", "clicks:-1"],
    });

    expect(advanced.observationClass).toBe("expected_progress");
    expect(advanced.replanReason).toBeUndefined();
    expect(advanced.commitment.cursor).toEqual({
      phaseIndex: 0,
      nodeIndex: 1,
    });

    const currentInstall = legalAction({
      actionId: "action:install:new:11",
      stateVersion: 11,
      type: "install_card",
      source: "ice:alpha",
      costs: [{ clicks: 1, credits: 1 }],
      targetRequirements: [
        { id: "server", kind: "server", allowedServers: ["rd"] },
      ],
      payload: { placement: "ice", serverId: "rd" },
    });
    const second = rematerializeCommittedTurnStep({
      commitment: advanced.commitment,
      rulesContext: setup.rules,
      runtimeInstanceId: "runtime:a",
      turnKey: "corp:1",
      stateIdentity: identity(11, "safe:11"),
      heads: [
        head(
          setup.plan,
          currentInstall,
          identity(11, "safe:11"),
          "node:install",
        ),
      ],
      legalActions: [currentInstall],
      continuationEvidence: validContinuationEvidence(),
    });

    expect(second.kind).toBe("executable");
    if (second.kind !== "executable") return;
    expect(second.lease.currentBinding.actionId).toBe("action:install:new:11");
    expect(second.lease.nodeId).toBe("node:install");
  });

  it("crosses an expected phase boundary only after exact phase-entry validation", () => {
    const setup = scenario();
    const commitment = createCommitment(setup);
    const first = executableLease(
      commitment,
      setup,
      setup.firstAction,
      identity(10, "safe:10"),
    );
    const advanced = advanceTurnPlanCommitment(commitment, {
      lease: first.lease,
      runtimeInstanceId: "runtime:a",
      turnKey: "corp:1",
      stateIdentityAfter: identity(11, "safe:11"),
      outcomeCodes: ["credits:+1", "clicks:-1"],
    });

    expect(advanced.observationClass).toBe("expected_phase_transition");
    expect(advanced.phaseEntryRequired).toBe(true);
    expect(advanced.commitment.status).toBe("active");
    expect(
      rematerializeCommittedTurnStep({
        commitment: advanced.commitment,
        rulesContext: setup.rules,
        runtimeInstanceId: "runtime:a",
        turnKey: "corp:1",
        stateIdentity: identity(11, "safe:11"),
        heads: [],
        legalActions: [],
        continuationEvidence: validContinuationEvidence(),
      }),
    ).toMatchObject({
      kind: "replan_required",
      reason: "phase_entry_invalid",
    });

    const entered = validateCommittedTurnPhaseEntry(advanced.commitment, {
      runtimeInstanceId: "runtime:a",
      turnKey: "corp:1",
      stateIdentity: identity(11, "safe:11"),
      phaseId: "phase:defense",
      entryFrameKey: "frame:after-credit",
      rootAssessmentFingerprint: "assessment:defense",
      satisfiedConditionCodes: ["credit_phase_complete"],
      supportAssignmentIds: ["assignment:install"],
      resourceHandoffIds: ["credits:reserved-for-rd"],
    });
    expect(entered.replanReason).toBeUndefined();
    expect(entered.commitment.phaseEntry.status).toBe("validated");
    expect(entered.commitment.cursor).toEqual({
      phaseIndex: 1,
      nodeIndex: 0,
    });
  });

  it("invalidates a mismatching phase entry instead of silently changing plans", () => {
    const setup = scenario();
    const commitment = createCommitment(setup);
    const first = executableLease(
      commitment,
      setup,
      setup.firstAction,
      identity(10, "safe:10"),
    );
    const advanced = advanceTurnPlanCommitment(commitment, {
      lease: first.lease,
      runtimeInstanceId: "runtime:a",
      turnKey: "corp:1",
      stateIdentityAfter: identity(11, "safe:11"),
      outcomeCodes: ["credits:+1", "clicks:-1"],
    });
    const entered = validateCommittedTurnPhaseEntry(advanced.commitment, {
      runtimeInstanceId: "runtime:a",
      turnKey: "corp:1",
      stateIdentity: identity(11, "safe:11"),
      phaseId: "phase:defense",
      entryFrameKey: "wrong-frame",
      rootAssessmentFingerprint: "assessment:defense",
      satisfiedConditionCodes: ["credit_phase_complete"],
      supportAssignmentIds: ["assignment:install"],
      resourceHandoffIds: ["credits:reserved-for-rd"],
    });

    expect(entered.replanReason).toBe("phase_entry_invalid");
    expect(entered.commitment.status).toBe("invalidated");
  });

  it("classifies cost, target and choice drift separately", () => {
    const setup = scenario({ samePhase: true });
    const commitment = createCommitment(setup);
    const variants: Array<{
      action: LegalAction;
      expected:
        | "material_cost_drift"
        | "material_target_drift"
        | "material_choice_drift";
    }> = [
      {
        action: { ...setup.firstAction, costs: [{ clicks: 1, credits: 2 }] },
        expected: "material_cost_drift",
      },
      {
        action: {
          ...setup.firstAction,
          targetRequirements: [{ id: "card", kind: "card" }],
        },
        expected: "material_target_drift",
      },
      {
        action: {
          ...setup.firstAction,
          choiceRequirements: [
            {
              choiceId: "amount",
              minSelections: 1,
              maxSelections: 1,
              optionIds: ["2"],
            },
          ],
        },
        expected: "material_choice_drift",
      },
    ];

    for (const variant of variants) {
      const result = rematerializeCommittedTurnStep({
        commitment,
        rulesContext: setup.rules,
        runtimeInstanceId: "runtime:a",
        turnKey: "corp:1",
        stateIdentity: identity(10, "safe:10"),
        heads: [head(setup.plan, variant.action, identity(10, "safe:10"))],
        legalActions: [variant.action],
        continuationEvidence: validContinuationEvidence(),
      });
      expect(result).toMatchObject({
        kind: "replan_required",
        reason: variant.expected,
      });
    }
  });

  it("detects target and choice route changes before issuing a lease", () => {
    const setup = scenario();
    const commitment = createCommitment(setup);
    const changedTargetPlan = structuredClone(setup.plan);
    changedTargetPlan.phases[0]!.nodes[0]!.invocation =
      buildCanonicalLegalActionInvocation({
        stateIdentity: identity(10, "safe:10"),
        semanticActionType: "economy.gain_credit",
        sourceCardInstanceId: "basic:credit",
        boundTargets: [
          {
            slotId: "server",
            ordering: "single",
            values: [{ kind: "server", id: "hq" }],
          },
        ],
      });

    const result = rematerializeCommittedTurnStep({
      commitment,
      rulesContext: setup.rules,
      runtimeInstanceId: "runtime:a",
      turnKey: "corp:1",
      stateIdentity: identity(10, "safe:10"),
      heads: [
        head(changedTargetPlan, setup.firstAction, identity(10, "safe:10")),
      ],
      legalActions: [setup.firstAction],
      continuationEvidence: validContinuationEvidence(),
    });
    expect(result).toMatchObject({
      kind: "replan_required",
      reason: "material_target_drift",
    });
  });

  it("replans on a scheduled boundary, material outcome deviation or urgent interrupt", () => {
    const boundarySetup = scenario({ boundary: true });
    const boundaryCommitment = createCommitment(boundarySetup);
    const boundaryLease = executableLease(
      boundaryCommitment,
      boundarySetup,
      boundarySetup.firstAction,
      identity(10, "safe:10"),
    );
    expect(
      advanceTurnPlanCommitment(boundaryCommitment, {
        lease: boundaryLease.lease,
        runtimeInstanceId: "runtime:a",
        turnKey: "corp:1",
        stateIdentityAfter: identity(11, "safe:11"),
        outcomeCodes: ["credits:+1", "clicks:-1"],
      }),
    ).toMatchObject({
      observationClass: "scheduled_information_boundary",
      replanReason: "scheduled_information_boundary",
      commitment: { status: "awaiting_observation" },
    });

    const setup = scenario({ samePhase: true });
    const commitment = createCommitment(setup);
    const lease = executableLease(
      commitment,
      setup,
      setup.firstAction,
      identity(10, "safe:10"),
    );
    expect(
      advanceTurnPlanCommitment(commitment, {
        lease: lease.lease,
        runtimeInstanceId: "runtime:a",
        turnKey: "corp:1",
        stateIdentityAfter: identity(11, "safe:11"),
        outcomeCodes: ["unexpected"],
      }),
    ).toMatchObject({
      observationClass: "material_outcome_deviation",
      replanReason: "material_outcome_deviation",
    });
    expect(
      advanceTurnPlanCommitment(commitment, {
        lease: lease.lease,
        runtimeInstanceId: "runtime:a",
        turnKey: "corp:1",
        stateIdentityAfter: identity(11, "safe:11"),
        outcomeCodes: ["credits:+1", "clicks:-1"],
        urgentInterrupt: true,
      }),
    ).toMatchObject({
      observationClass: "urgent_interrupt",
      replanReason: "urgent_interrupt",
    });
  });

  it("forces a new plan after runtime restart even when the visible fingerprint is unchanged", () => {
    const setup = scenario();
    const commitment = createCommitment(setup);

    expect(
      invalidateTurnPlanCommitmentForRestart(commitment, "runtime:b"),
    ).toMatchObject({
      observationClass: "runtime_restarted",
      replanReason: "runtime_restarted",
      commitment: { status: "replanned" },
    });
    expect(
      rematerializeCommittedTurnStep({
        commitment,
        rulesContext: setup.rules,
        runtimeInstanceId: "runtime:b",
        turnKey: "corp:1",
        stateIdentity: identity(10, "safe:10"),
        heads: [],
        legalActions: [],
        continuationEvidence: validContinuationEvidence(),
      }),
    ).toMatchObject({
      kind: "replan_required",
      reason: "runtime_restarted",
    });
  });

  it("requires hard commitment revalidation and a valid campaign requote", () => {
    const setup = scenario({ campaign: true });
    const commitment = createCommitment(setup);
    const missingHard = rematerializeCommittedTurnStep({
      commitment,
      rulesContext: setup.rules,
      runtimeInstanceId: "runtime:a",
      turnKey: "corp:1",
      stateIdentity: identity(10, "safe:10"),
      heads: [],
      legalActions: [],
      continuationEvidence: {
        hardPlanCommitments: [],
        campaignRequotes: [
          {
            campaignId: "campaign:score",
            status: "valid",
            evidenceCodes: [],
          },
        ],
      },
    });
    expect(missingHard).toMatchObject({
      kind: "replan_required",
      reason: "hard_plan_commitment_invalid",
    });

    const missingQuote = rematerializeCommittedTurnStep({
      commitment,
      rulesContext: setup.rules,
      runtimeInstanceId: "runtime:a",
      turnKey: "corp:1",
      stateIdentity: identity(10, "safe:10"),
      heads: [],
      legalActions: [],
      continuationEvidence: {
        hardPlanCommitments: [
          {
            commitmentId: "hard:score",
            status: "valid",
            evidenceCodes: [],
          },
        ],
        campaignRequotes: [],
      },
    });
    expect(missingQuote).toMatchObject({
      kind: "replan_required",
      reason: "campaign_requote_invalid",
    });
  });

  it("certifies EndTurn only from the current real LegalAction set", () => {
    const rules = rulesContext();
    const state = identity(20, "safe:20");
    const endTurn = legalAction({
      actionId: "action:end:20",
      stateVersion: 20,
      type: "end_turn",
      source: "game_rule",
    });
    const plan = singleActionPlan(endTurn, state, rules.fingerprint);
    const endTurnHead = head(plan, endTurn, state, "node:end");
    const input = decisionInput(state, [endTurn]);
    const certificate = certifyCurrentTurnCompletion({
      input,
      rulesContext: rules,
      turnKey: "corp:2",
      stateIdentity: state,
      endTurnHead,
      priorityCoverage: emptyCoverage(),
      mandatoryEngineWindowComplete: true,
      cleanupAndDispositionComplete: true,
      unresolvedDispositionActionIds: [],
      openMandatoryCommitmentIds: [],
      remainingRestrictedActionIds: [],
    });

    expect(certificate.endTurnActionId).toBe("action:end:20");
    expect(certificate.stateIdentity).toEqual(state);
    expect(certificate.certificateId).toMatch(/^fnv1a:/);
    expect(() =>
      certifyCurrentTurnCompletion({
        input: decisionInput(state, [endTurn], 1),
        rulesContext: rules,
        turnKey: "corp:2",
        stateIdentity: state,
        endTurnHead,
        priorityCoverage: emptyCoverage(),
        mandatoryEngineWindowComplete: true,
        cleanupAndDispositionComplete: true,
        unresolvedDispositionActionIds: ["action:unknown"],
        openMandatoryCommitmentIds: [],
        remainingRestrictedActionIds: [],
      }),
    ).toThrowError(TurnPlanCommitmentError);
    expect(() =>
      certifyCurrentTurnCompletion({
        input,
        rulesContext: rules,
        turnKey: "corp:2",
        stateIdentity: state,
        endTurnHead,
        priorityCoverage: emptyCoverage(),
        mandatoryEngineWindowComplete: true,
        cleanupAndDispositionComplete: true,
        unresolvedDispositionActionIds: [],
        openMandatoryCommitmentIds: [],
        remainingRestrictedActionIds: ["action:restricted-run"],
      }),
    ).toThrowError(/uncertified_restricted_capacity_remains/);
    expect(() =>
      certifyCurrentTurnCompletion({
        input,
        rulesContext: rules,
        turnKey: "corp:2",
        stateIdentity: state,
        endTurnHead,
        priorityCoverage: emptyCoverage(),
        mandatoryEngineWindowComplete: true,
        cleanupAndDispositionComplete: true,
        unresolvedDispositionActionIds: [],
        openMandatoryCommitmentIds: [],
        remainingRestrictedActionIds: ["action:restricted-run"],
        restrictedCapacityForgo: {
          capacityKind: "zero_click_non_basic_run_only",
          explicitlyNonproductiveActionIds: ["action:restricted-run"],
        },
      }),
    ).not.toThrow();
  });

  it("produces replay-stable commitment and certificate identities", () => {
    const first = scenario();
    const second = scenario();
    const firstCommitment = createCommitment(first);
    const secondCommitment = createCommitment(second);
    expect(firstCommitment).toEqual(secondCommitment);

    const endTurn = legalAction({
      actionId: "ephemeral:first",
      stateVersion: 20,
      type: "end_turn",
      source: "game_rule",
    });
    const alternateId = { ...endTurn, actionId: "ephemeral:second" };
    const rules = rulesContext();
    const state = identity(20, "safe:20");
    const firstPlan = singleActionPlan(endTurn, state, rules.fingerprint);
    const secondPlan = singleActionPlan(alternateId, state, rules.fingerprint);
    const base = {
      rulesContext: rules,
      turnKey: "corp:2",
      stateIdentity: state,
      priorityCoverage: emptyCoverage(),
      mandatoryEngineWindowComplete: true,
      cleanupAndDispositionComplete: true,
      unresolvedDispositionActionIds: [],
      openMandatoryCommitmentIds: [],
      remainingRestrictedActionIds: [],
    };
    const firstCertificate = certifyCurrentTurnCompletion({
      ...base,
      input: decisionInput(state, [endTurn]),
      endTurnHead: head(firstPlan, endTurn, state, "node:end"),
    });
    const secondCertificate = certifyCurrentTurnCompletion({
      ...base,
      input: decisionInput(state, [alternateId]),
      endTurnHead: head(secondPlan, alternateId, state, "node:end"),
    });
    expect(firstCertificate.legalActionSetFingerprint).toBe(
      secondCertificate.legalActionSetFingerprint,
    );
    expect(firstCertificate.certificateId).not.toBe(
      secondCertificate.certificateId,
    );
  });
});

function scenario(
  options: {
    samePhase?: boolean;
    boundary?: boolean;
    campaign?: boolean;
  } = {},
) {
  const rules = rulesContext();
  const current = identity(10, "safe:10");
  const firstAction = legalAction({
    actionId: "action:credit:10",
    stateVersion: 10,
    type: "gain_credit",
    source: "basic:credit",
    costs: [{ clicks: 1 }],
  });
  const installAction = legalAction({
    actionId: "action:install:projected",
    stateVersion: 11,
    type: "install_card",
    source: "ice:alpha",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [
      { id: "server", kind: "server", allowedServers: ["rd"] },
    ],
    payload: { placement: "ice", serverId: "rd" },
  });
  const firstInvocation = invocationForAction(firstAction, current);
  const installInvocation = invocationForAction(installAction, current);
  const firstNode = {
    nodeId: "node:credit",
    invocation: firstInvocation,
    executionBinding: binding(firstAction, firstInvocation.invocationKey),
    expectedStateDeltaCodes: ["credits:+1", "clicks:-1"],
    ...(options.boundary
      ? { boundaryAfter: "public_random_outcome" as const }
      : {}),
  };
  const secondNode = {
    nodeId: "node:install",
    invocation: installInvocation,
    expectedStateDeltaCodes: ["ice_installed:rd", "clicks:-1"],
  };
  const plan: TurnPlan = {
    schemaVersion: TURN_PLANNING_CONTRACT_SCHEMA_VERSION,
    planId: "plan:corp:1",
    side: "corp",
    turnKey: "corp:1",
    stateIdentity: current,
    planningRulesFingerprint: rules.fingerprint,
    evaluationRegistryVersion: TURN_PLAN_EVALUATION_REGISTRY_VERSION,
    phases: options.boundary
      ? [
          {
            phaseId: "phase:boundary",
            root: {
              planInstanceId: "root:economy",
              moduleId: "corp.economy",
              milestoneId: "observe-random-economy",
              provenance: "resident",
            },
            rootAssessmentFingerprint: "assessment:economy",
            entryFrameKey: "frame:10",
            entryConditions: [],
            completionCondition: { code: "random_economy_resolved" },
            supportLeaves: [],
            nodes: [firstNode],
            protectedValueClaimIds: [],
            transition: { kind: "observation_boundary" },
          },
        ]
      : options.samePhase
        ? [
            {
              phaseId: "phase:economy-defense",
              root: {
                planInstanceId: "root:economy",
                moduleId: "corp.economy",
                milestoneId: "fund-and-install",
                provenance: "resident",
              },
              rootAssessmentFingerprint: "assessment:economy",
              entryFrameKey: "frame:10",
              entryConditions: [],
              completionCondition: { code: "rd_ice_installed" },
              supportLeaves: [],
              nodes: [firstNode, secondNode],
              protectedValueClaimIds: [],
              transition: { kind: "turn_end" },
            },
          ]
        : [
            {
              phaseId: "phase:economy",
              root: {
                planInstanceId: "root:economy",
                moduleId: "corp.economy",
                milestoneId: "fund-defense",
                provenance: "resident",
              },
              ...(options.campaign
                ? { hardPlanCommitmentId: "hard:score" }
                : {}),
              rootAssessmentFingerprint: "assessment:economy",
              entryFrameKey: "frame:10",
              entryConditions: [],
              completionCondition: { code: "credit_phase_complete" },
              supportLeaves: [],
              nodes: [firstNode],
              protectedValueClaimIds: [],
              transition: {
                kind: "next_bound_phase",
                nextPhaseId: "phase:defense",
                reasonCode: "credit_phase_complete",
                resourceHandoffIds: ["credits:reserved-for-rd"],
              },
            },
            {
              phaseId: "phase:defense",
              root: {
                planInstanceId: "root:defense",
                moduleId: "corp.defend_servers",
                milestoneId: "protect-rd",
                provenance: "resident",
              },
              rootAssessmentFingerprint: "assessment:defense",
              entryFrameKey: "frame:after-credit",
              entryConditions: [{ code: "credit_phase_complete" }],
              completionCondition: { code: "rd_ice_installed" },
              supportLeaves: [
                {
                  planInstanceId: "support:install",
                  moduleId: "corp.economy",
                  parentNeedId: "need:install",
                  assignmentId: "assignment:install",
                },
              ],
              nodes: [secondNode],
              protectedValueClaimIds: [],
              transition: { kind: "turn_end" },
            },
          ],
    cursor: { phaseIndex: 0, nodeIndex: 0 },
    priorityObligations: [],
    priorityCoverage: emptyCoverage(),
    campaignValueClaims: options.campaign ? [campaignClaim()] : [],
  };
  return { rules, plan, firstAction, installAction };
}

function createCommitment(setup: ReturnType<typeof scenario>) {
  const nodeIds = new Set(
    setup.plan.phases.flatMap((phase) =>
      phase.nodes.map((node) => node.nodeId),
    ),
  );
  return createTurnPlanCommitment({
    plan: setup.plan,
    rulesContext: setup.rules,
    runtimeInstanceId: "runtime:a",
    nodeExpectations: [
      executionExpectationFromLegalAction({
        nodeId: "node:credit",
        legalAction: setup.firstAction,
        expectedStateDeltaCodes: ["credits:+1", "clicks:-1"],
      }),
      executionExpectationFromLegalAction({
        nodeId: "node:install",
        legalAction: setup.installAction,
        expectedStateDeltaCodes: ["ice_installed:rd", "clicks:-1"],
      }),
    ].filter((expectation) => nodeIds.has(expectation.nodeId)),
  });
}

function executableLease(
  commitment: ReturnType<typeof createCommitment>,
  setup: ReturnType<typeof scenario>,
  action: LegalAction,
  state: PlanningStateIdentity,
) {
  const result = rematerializeCommittedTurnStep({
    commitment,
    rulesContext: setup.rules,
    runtimeInstanceId: "runtime:a",
    turnKey: "corp:1",
    stateIdentity: state,
    heads: [head(setup.plan, action, state)],
    legalActions: [action],
    continuationEvidence: validContinuationEvidence(),
  });
  if (result.kind !== "executable") {
    throw new Error(`Expected executable lease, got ${result.reason}`);
  }
  return result;
}

function validContinuationEvidence(): TurnPlanContinuationEvidence {
  return {
    hardPlanCommitments: [
      {
        commitmentId: "hard:score",
        status: "valid",
        evidenceCodes: [],
      },
    ],
    campaignRequotes: [
      {
        campaignId: "campaign:score",
        status: "valid",
        evidenceCodes: [],
      },
    ],
  };
}

function head(
  plan: TurnPlan,
  action: LegalAction,
  state: PlanningStateIdentity,
  nodeId = "node:credit",
): TurnPlanningHeadCandidate {
  const plannedNode = plan.phases
    .flatMap((phase) => phase.nodes)
    .find((node) => node.nodeId === nodeId)!;
  const invocation = buildCanonicalLegalActionInvocation({
    stateIdentity: state,
    semanticActionType: plannedNode.invocation.semanticActionType,
    ...(plannedNode.invocation.sourceCardInstanceId
      ? {
          sourceCardInstanceId: plannedNode.invocation.sourceCardInstanceId,
        }
      : {}),
    ...(plannedNode.invocation.sourceAbilityBinding
      ? {
          sourceAbilityBinding: plannedNode.invocation.sourceAbilityBinding,
        }
      : {}),
    boundTargets: plannedNode.invocation.boundTargets,
    boundChoices: plannedNode.invocation.boundChoices,
  });
  const phase = plan.phases.find((candidate) =>
    candidate.nodes.some((node) => node.nodeId === nodeId),
  )!;
  const semanticActionSetFingerprint = buildSemanticActionSetFingerprint([
    action,
  ]);
  return {
    candidateId: `head:${nodeId}:${state.stateVersion}`,
    side: "corp",
    moduleId: phase.root.moduleId,
    rootPlanInstanceId: phase.root.planInstanceId,
    nextMilestoneId: phase.root.milestoneId,
    stepFingerprint: `step:${nodeId}`,
    horizonCapability: "context_dependent",
    instanceHorizon: "current_turn",
    priorityClass: "P4",
    invocation,
    currentBinding: binding(action, invocation.invocationKey),
    executableWitness: {
      stateVersion: state.stateVersion,
      sideSafePlanningFingerprint: state.sideSafePlanningFingerprint,
      semanticActionSetFingerprint,
      stepFingerprint: `step:${nodeId}`,
      invocationKey: invocation.invocationKey,
      quoteIds: [],
      safetyPolicyVersion: "test:v1",
      allRouteDefiningChoicesBound: true,
    },
    evaluationValues: {},
    valueClaims: [],
    evidenceCodes: [],
  };
}

function binding(action: LegalAction, invocationKey: string) {
  return {
    actionId: action.actionId,
    stateVersion: action.expiresAtStateVersion,
    semanticActionSetFingerprint: buildSemanticActionSetFingerprint([action]),
    invocationKey,
  };
}

function invocationForAction(
  action: LegalAction,
  state: PlanningStateIdentity,
) {
  const semanticActionType =
    action.type === "install_card"
      ? "install.card"
      : action.type === "end_turn"
        ? "turn_flow.end_turn"
        : "economy.gain_credit";
  return buildCanonicalLegalActionInvocation({
    stateIdentity: state,
    semanticActionType,
    ...(action.source === "game_rule"
      ? {}
      : { sourceCardInstanceId: action.source }),
    boundTargets:
      action.type === "install_card"
        ? [
            {
              slotId: "server",
              ordering: "single",
              values: [{ kind: "server", id: "rd" }],
            },
          ]
        : [],
  });
}

function singleActionPlan(
  action: LegalAction,
  state: PlanningStateIdentity,
  rulesFingerprint: string,
): TurnPlan {
  const invocation = invocationForAction(action, state);
  return {
    schemaVersion: TURN_PLANNING_CONTRACT_SCHEMA_VERSION,
    planId: "plan:end-turn",
    side: "corp",
    turnKey: "corp:2",
    stateIdentity: state,
    planningRulesFingerprint: rulesFingerprint,
    evaluationRegistryVersion: TURN_PLAN_EVALUATION_REGISTRY_VERSION,
    phases: [
      {
        phaseId: "phase:complete",
        root: {
          planInstanceId: "root:complete",
          moduleId: "corp.complete_turn",
          milestoneId: "turn-complete",
          provenance: "resident",
        },
        rootAssessmentFingerprint: "assessment:complete",
        entryFrameKey: `frame:${state.stateVersion}`,
        entryConditions: [],
        completionCondition: { code: "turn_complete" },
        supportLeaves: [],
        nodes: [
          {
            nodeId: "node:end",
            invocation,
            executionBinding: binding(action, invocation.invocationKey),
            expectedStateDeltaCodes: ["turn_ended"],
          },
        ],
        protectedValueClaimIds: [],
        transition: { kind: "turn_end" },
      },
    ],
    cursor: { phaseIndex: 0, nodeIndex: 0 },
    priorityObligations: [],
    priorityCoverage: emptyCoverage(),
    campaignValueClaims: [],
  };
}

function legalAction(params: {
  actionId: string;
  stateVersion: number;
  type: "gain_credit" | "install_card" | "end_turn";
  source: string;
  costs?: LegalAction["costs"];
  targetRequirements?: LegalAction["targetRequirements"];
  choiceRequirements?: LegalAction["choiceRequirements"];
  payload?: LegalAction["payload"];
}): LegalAction {
  return {
    actionId: params.actionId,
    side: "corp",
    type: params.type,
    label: params.type,
    source: params.source as LegalAction["source"],
    timingPoint: "corp_action.main",
    costs: params.costs ?? [],
    targetRequirements: params.targetRequirements ?? [],
    ...(params.choiceRequirements
      ? { choiceRequirements: params.choiceRequirements }
      : {}),
    visibility: "private_to_actor",
    expiresAtStateVersion: params.stateVersion,
    ...(params.payload ? { payload: params.payload } : {}),
  } as LegalAction;
}

function decisionInput(
  state: PlanningStateIdentity,
  legalActions: LegalAction[],
  clicks = 0,
): Pick<AiDecisionInput, "side" | "playerView" | "legalActions"> {
  return {
    side: "corp",
    playerView: {
      stateVersion: state.stateVersion,
      own: { clicks },
    } as AiDecisionInput["playerView"],
    legalActions,
  };
}

function identity(
  stateVersion: number,
  sideSafePlanningFingerprint: string,
): PlanningStateIdentity {
  return { stateVersion, sideSafePlanningFingerprint };
}

function rulesContext() {
  return buildPlanningRulesContext({
    rulesBaseline: CURRENT_RULES_BASELINE,
    formatProfileId: "test-format",
    cardPoolSnapshotId: "test-pool",
  });
}

function emptyCoverage() {
  return {
    requiredObligationIds: [],
    satisfiedObligationIds: [],
    violatedObligationIds: [],
    deferredObligationIds: [],
  };
}

function campaignClaim(): CampaignValueClaim {
  return {
    claimId: "claim:score",
    campaignId: "campaign:score",
    ownerModuleId: "corp.economy",
    objectiveKey: "score",
    componentKey: "funding",
    evaluationDimensionId: "economy",
    aggregationMode: "delta_from_previous_prefix",
    contributionKind: "funding_gap_reduction",
    beforeQuoteId: "quote:before",
    afterQuoteId: "quote:after",
    amount: 2,
    dependencyKeys: [],
    conflictKeys: [],
    status: "quoted",
  };
}
