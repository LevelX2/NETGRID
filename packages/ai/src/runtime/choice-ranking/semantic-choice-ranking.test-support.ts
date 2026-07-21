import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { SemanticRuntimeChoice } from "../semantic-runtime-types";
import {
  createPlanStep,
  createTacticalPlan,
  type PlanStepMappingResult,
} from "../../tactical-plans";

export function scoreConversionMapping(
  actions: LegalAction[],
  overrides: {
    status?: "active" | "progressing" | "blocked";
    evidence?: string[];
  } = {},
): PlanStepMappingResult {
  const step = createPlanStep({
    stepId: "score_conversion:install_score_target:agenda",
    kind: "install_or_prepare_agenda",
    desiredActionSemantics: ["install.card", "scoreline"],
    actionCandidateIds: actions.map((action) => action.actionId),
  });
  return {
    plan: createTacticalPlan({
      planId: "corp.create_score_window:conversion:agenda",
      side: "corp",
      type: "corp.create_score_window",
      status: overrides.status ?? "active",
      priority: 970,
      horizonTurns: 1,
      target: { kind: "card", id: "agenda" },
      currentStep: step,
      evidence: overrides.evidence ?? [
        "corp_score_conversion_same_turn_guaranteed:true",
        "corp_score_sequence:same_turn_conversion",
      ],
      stateVersion: 1,
    }),
    step,
    status: "matched",
    actionCandidateIds: actions.map((action) => action.actionId),
    actionPriorities: [],
    legalActions: actions,
    rationale: [],
  };
}

export function finiteEconomyMapping(
  actions: LegalAction[],
): PlanStepMappingResult {
  const step = createPlanStep({
    stepId: "install_finite_economy:bbs",
    kind: "install_finite_economy",
    desiredActionSemantics: ["install.card", "economy.finite_pool"],
    actionCandidateIds: actions.map((action) => action.actionId),
  });
  return {
    plan: createTacticalPlan({
      planId: "corp.develop_finite_economy:bbs",
      side: "corp",
      type: "corp.develop_finite_economy",
      status: "active",
      priority: 760,
      horizonTurns: 3,
      target: { kind: "card", id: "bbs" },
      currentStep: step,
      stateVersion: 1,
    }),
    step,
    status: "matched",
    actionCandidateIds: actions.map((action) => action.actionId),
    actionPriorities: [],
    legalActions: actions,
    rationale: [],
  };
}

export function createRezFundingMapping(
  actions: LegalAction[],
): PlanStepMappingResult {
  const step = createPlanStep({
    stepId: "corp.rez_defense:hq:fund:build_rez_reserve",
    kind: "build_rez_reserve",
    desiredActionSemantics: ["economy.gain_credit"],
    actionCandidateIds: actions.map((action) => action.actionId),
  });
  return {
    plan: createTacticalPlan({
      planId: "corp.rez_defense:hq:fund",
      side: "corp",
      type: "corp.rez_defense",
      status: "progressing",
      priority: 1_006,
      horizonTurns: 1,
      target: { kind: "server", id: "hq" },
      currentStep: step,
      blockers: [
        {
          blockerId: "corp.rez_defense:hq:fund:missing_rez_reserve",
          kind: "missing_rez_reserve",
          severity: "soft",
          removalStepKind: "build_rez_reserve",
          evidence: ["save for a later HQ rez"],
        },
      ],
      stateVersion: 1,
    }),
    step,
    status: "matched",
    actionCandidateIds: actions.map((action) => action.actionId),
    actionPriorities: [],
    legalActions: actions,
    rationale: [],
  };
}

export function scorelineSupportMapping(
  actions: LegalAction[],
  overrides: {
    stepKind?: "protect_remote" | "build_rez_reserve";
  } = {},
): PlanStepMappingResult {
  const stepKind = overrides.stepKind ?? "protect_remote";
  const step = createPlanStep({
    stepId: "protect_remote:agenda",
    kind: stepKind,
    desiredActionSemantics: ["install.card", "corp_window.rez"],
    actionCandidateIds: actions.map((action) => action.actionId),
  });
  return {
    plan: createTacticalPlan({
      planId: "corp.create_score_window:agenda",
      side: "corp",
      type: "corp.create_score_window",
      status: "progressing",
      priority: 940,
      horizonTurns: 3,
      target: { kind: "server", id: "remote_1" },
      currentStep: step,
      stateVersion: 1,
    }),
    step,
    status: "matched",
    actionCandidateIds: actions.map((action) => action.actionId),
    actionPriorities: [],
    legalActions: actions,
    rationale: [],
  };
}

export function choice(
  action: LegalAction,
  score: number,
  evidence: string[] = [],
  component?: { key: string; value: number; reason: string },
): SemanticRuntimeChoice {
  return {
    action,
    scopeId:
      action.type === "start_run"
        ? "simple_hq_or_rnd_pressure"
        : "basic_economy_draw",
    score,
    scoreBreakdown: [
      {
        key: "test_score",
        label: "Test score",
        value: score,
        reason: "test",
      },
      ...(component
        ? [
            {
              key: component.key,
              label: "Focused component",
              value: component.value,
              reason: component.reason,
            },
          ]
        : []),
    ],
    reasonCode: `runner.semantic.${action.type}`,
    explanation: action.label,
    evidence,
  };
}

export function strategicEvidence(targetMatch: "exact" | "kind"): string[] {
  return [
    "semantic_strategic_action_fit:true",
    `strategic_action_fit_target_match:${targetMatch}`,
  ];
}

export function scoreComponentEvidence(key: string): string[] {
  return [`semantic_score_component:${key}`];
}

export function coverageMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.obtain_breaker_coverage", legalActions);
}

export function creditBaseMapping(
  legalActions: LegalAction[],
  overrides: {
    actionPriorities?: PlanStepMappingResult["actionPriorities"];
  } = {},
): PlanStepMappingResult {
  return planMapping("runner.build_credit_base", legalActions, overrides);
}

export function centralRunMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.opportunistic_central_run", legalActions);
}

export function bankBuildMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.build_credit_bank", legalActions, {
    stepKind: "build_bank_counter",
    evidence: ["runner_bank_concrete_funding_need:false"],
  });
}

export function bestHandCardMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.play_best_hand_card", legalActions, {
    stepKind: "install_development_card",
  });
}

export function fundedDevelopmentMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.develop_hand_card", legalActions, {
    stepKind: "install_development_card",
    evidence: ["funded_hand_development_continuation:true"],
  });
}

export function tagClearMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.clear_tags_or_survive", legalActions, {
    stepKind: "clear_tags",
  });
}

export function survivalMapping(
  legalActions: LegalAction[],
  actionPriority: number,
): PlanStepMappingResult {
  return planMapping("runner.survival_defense", legalActions, {
    stepKind: "find_survival_answer",
    actionPriorities: legalActions.map((action) => ({
      actionId: action.actionId,
      priority: actionPriority,
    })),
  });
}

export function remoteContestMapping(
  legalActions: LegalAction[],
  overrides: {
    evidence?: string[];
    priority?: number;
  } = {},
): PlanStepMappingResult {
  return planMapping("runner.contest_remote", legalActions, overrides);
}

export function planMapping(
  type: string,
  legalActions: LegalAction[],
  overrides: {
    evidence?: string[];
    priority?: number;
    stepKind?: PlanStepMappingResult["step"]["kind"];
    actionPriorities?: PlanStepMappingResult["actionPriorities"];
  } = {},
): PlanStepMappingResult {
  const stepKind = overrides.stepKind ?? "gain_credits";
  return {
    status: "matched",
    plan: {
      planId: `${type}:remote_1`,
      side: "runner",
      type,
      status: "active",
      priority: overrides.priority ?? 100,
      horizonTurns: 1,
      target: { kind: "server", id: "remote_1" },
      requiredCapabilities: [],
      currentStep: {
        stepId: "gain_for_breaker",
        kind: stepKind,
        desiredActionSemantics: ["economy.gain_credit"],
        requiredCapabilities: [],
        rationale: [],
      },
      evidence: overrides.evidence ?? [],
      scoreBreakdown: [],
      stateVersion: 1,
    },
    step: {
      stepId: "gain_for_breaker",
      kind: stepKind,
      desiredActionSemantics: ["economy.gain_credit"],
      requiredCapabilities: [],
      rationale: [],
    },
    legalActions,
    actionCandidateIds: legalActions.map((action) => action.actionId),
    actionPriorities: overrides.actionPriorities ?? [],
    rationale: [],
  } as unknown as PlanStepMappingResult;
}

export function legalAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload,
  };
}

export function aiInput(
  eventTail: AiDecisionInput["eventTail"] = [],
): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: 20,
      side: "runner",
      activeSide: "runner",
      phase: "runner_action_phase",
      timingPoint: "runner_action.main",
      own: {
        identity: {
          instanceId: "runner",
          definitionId: "runner",
          title: "Runner",
          owner: "runner",
          controller: "runner",
          type: "identity",
          known: true,
        },
        credits: 3,
        clicks: 2,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: {
          instanceId: "corp",
          definitionId: "corp",
          title: "Corp",
          owner: "corp",
          controller: "corp",
          type: "identity",
          known: true,
        },
        credits: 4,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail,
    legalActions: [],
    difficulty: "normal",
    seed: "semantic-choice-ranking-test",
    decisionId: "semantic-choice-ranking-test",
    actionNumber: 1,
    profileId: "semantic-choice-ranking-test",
  };
}

export function runEvent(
  payload: Record<string, unknown>,
): AiDecisionInput["eventTail"][number] {
  return {
    eventId: `event-${JSON.stringify(payload)}`,
    type: "start_run",
    stateVersionBefore: 18,
    stateVersionAfter: 19,
    stateHashAfter: "test-hash",
    publicPayload: {
      actor: "runner",
      actionType: "start_run",
      ...payload,
    },
  } as AiDecisionInput["eventTail"][number];
}
