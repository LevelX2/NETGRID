import type { AiDecisionInput, LegalAction, ServerId } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type {
  RunnerRunTargetEvaluation,
  RunnerRunTargetKind,
} from "../runner-run-target-evaluation";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";
import type {
  RunnerRunAccessIntent,
  RunnerRunObjective,
  RunnerRunPlan,
  RunnerRunPlanOrigin,
  RunnerRunPlanServerId,
} from "./runner-run-plan-types";
import { quoteRunnerRunPath } from "./runner-run-plan-path-quote";

export function createRunnerRunPlanForSelectedAction(params: {
  input: AiDecisionInput;
  selectedAction: LegalAction;
  runnerRunTargetEvaluations?: readonly RunnerRunTargetEvaluation[];
  runnerTacticalGoals?: readonly RunnerTacticalGoal[];
  runnerStrategicIntent?: RunnerStrategicIntentProfile;
  actionSemanticCandidates?: readonly ActionSemanticCandidate[];
}): RunnerRunPlan | undefined {
  const { input, selectedAction } = params;
  if (input.side !== "runner" || selectedAction.side !== "runner") {
    return undefined;
  }
  if (!runnerRunStartActionCanCreatePlan(selectedAction)) return undefined;
  const targetServerId = runnerRunPlanTargetServerId(selectedAction);
  if (!targetServerId) return undefined;
  const targetEvaluation = runnerRunTargetEvaluationForAction({
    action: selectedAction,
    targetServerId,
    evaluations: params.runnerRunTargetEvaluations ?? [],
  });
  const targetKind =
    targetEvaluation?.accessTargetKind ?? targetKindForServerId(targetServerId);
  if (!targetKind) return undefined;
  const expectedValue = Math.max(0, targetEvaluation?.score ?? 0);
  const expectedAccessCount = targetEvaluation?.multiaccessAvailable ? 2 : 1;
  const objective = runnerRunObjectiveFor({
    targetKind,
    expectedValue,
    expectedAccessCount,
    evaluation: targetEvaluation,
  });
  const accessIntent = runnerRunAccessIntentFor({
    targetServerId,
    expectedAccessCount,
    evaluation: targetEvaluation,
  });
  const now = input.playerView.stateVersion;
  const pathCost = Math.max(0, targetEvaluation?.pathCost ?? 0);
  const creditsAfterRun =
    targetEvaluation?.creditsAfterRun ?? input.playerView.own.credits - pathCost;
  const actionCandidate = params.actionSemanticCandidates?.find(
    (candidate) => candidate.actionId === selectedAction.actionId,
  );
  const maxSpendThisRun = numberPayloadValue(selectedAction, "spendLimit");
  const matchingGoals = (params.runnerTacticalGoals ?? []).filter(
    (goal) =>
      goal.targetServerId === undefined || goal.targetServerId === targetServerId,
  );
  const plan: RunnerRunPlan = {
    id: [
      "runner_run_plan",
      input.decisionId,
      selectedAction.actionId,
      targetServerId,
    ].join(":"),
    side: "runner",
    lifecycle: "created",
    origin: runnerRunPlanOriginFor(selectedAction),
    objective,
    targetServer: { id: targetServerId },
    accessIntent,
    runStartActionId: selectedAction.actionId,
    sourceTacticalGoalIds: matchingGoals.map((goal) => goal.goalId),
    sourceStrategyEvidence: [
      ...(params.runnerStrategicIntent?.evidence ?? []).slice(0, 8),
      ...matchingGoals.flatMap((goal) => goal.evidence.slice(0, 2)),
    ],
    budget: {
      availableCredits: input.playerView.own.credits,
      runOnlyCredits: 0,
      recurringBreakerCredits: 0,
      recurringKillerCredits: 0,
      recurringLinkCredits: 0,
      stealthCredits: 0,
      nonNoisyBreakerCredits: 0,
      ...(maxSpendThisRun !== undefined ? { maxSpendThisRun } : {}),
      reservedCreditsAfterRun: 0,
      reservedCreditsForSteal: accessIntent.reserveForStealOrTrash,
      reservedCreditsForTrash: accessIntent.reserveForStealOrTrash,
      damageSafetyReserve: {
        minimumGripAfterRun: 0,
        preventionCreditsReserved: 0,
        evidence: [],
      },
      tagSafetyReserve: {
        minimumCreditsAfterTags: 0,
        expectedTagCount: targetEvaluation?.expectedTagsFromVisibleIce ?? 0,
        evidence: [],
      },
    },
    reserve: {
      minimumCreditsAfterRun: 0,
      minimumGripAfterRun: 0,
      preserveStealOrTrashCredits: accessIntent.reserveForStealOrTrash,
      evidence: [],
    },
    pathQuote: {
      server: targetServerId,
      quoteStatus: targetEvaluation ? "partially_known" : "unknown",
      iceQuotes: [],
      totalKnownCost: pathCost,
      expectedUnknownCost: 0,
      expectedRemainingCredits: creditsAfterRun,
      reserveViolation: creditsAfterRun < 0,
      canReachAccess: targetEvaluation?.pathPassability === "reachable",
      ...(targetEvaluation && targetEvaluation.pathPassability !== "reachable"
        ? { cannotReachReason: targetEvaluation.pathPassability }
        : {}),
      requiredSequences: [],
    },
    revalidation: {
      status: "valid",
      reasons: ["run_plan_created_from_selected_run_action"],
      checkedAtStateVersion: now,
    },
    abortPolicy: {
      allowJackOutWhenLegal: true,
      abortBelowCredits: 0,
      abortReasons: [],
    },
    visibilityEvidence: [
      { kind: "legal_action", ref: selectedAction.actionId },
      ...(actionCandidate
        ? [
            {
              kind: "action_semantic_candidate" as const,
              ref: actionCandidate.semanticActionType,
            },
          ]
        : []),
    ],
    debug: {
      summary: `RunPlan ${objective.kind} auf ${targetServerId}`,
      items: [
        `objective:${objective.kind}`,
        `target:${targetServerId}`,
        `origin:${runnerRunPlanOriginFor(selectedAction)}`,
        ...(targetEvaluation
          ? [
              `run_target_recommendation:${targetEvaluation.recommendation}`,
              `run_target_path:${targetEvaluation.pathPassability}`,
              `run_target_payoff:${targetEvaluation.accessPayoff}`,
            ]
          : ["run_target_evaluation:missing"]),
      ],
    },
    createdAtStateVersion: now,
    updatedAtStateVersion: now,
  };
  return {
    ...plan,
    pathQuote: quoteRunnerRunPath(input, plan),
  };
}

function runnerRunStartActionCanCreatePlan(action: LegalAction): boolean {
  return action.type === "start_run";
}

function runnerRunPlanTargetServerId(
  action: LegalAction,
): RunnerRunPlanServerId | undefined {
  const value = action.payload?.serverId;
  if (typeof value !== "string") return undefined;
  return isRunnerRunPlanServerId(value) ? value : undefined;
}

function isRunnerRunPlanServerId(value: string): value is RunnerRunPlanServerId {
  return value === "hq" || value === "rd" || value === "archives" || /^remote_\d+$/.test(value);
}

function targetKindForServerId(
  serverId: ServerId,
): RunnerRunTargetKind | undefined {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  if (serverId.startsWith("remote_")) return "remote";
  return undefined;
}

function runnerRunTargetEvaluationForAction(params: {
  action: LegalAction;
  targetServerId: RunnerRunPlanServerId;
  evaluations: readonly RunnerRunTargetEvaluation[];
}): RunnerRunTargetEvaluation | undefined {
  return (
    params.evaluations.find(
      (evaluation) =>
        evaluation.actionId === params.action.actionId &&
        evaluation.targetServerId === params.targetServerId,
    ) ??
    params.evaluations.find(
      (evaluation) => evaluation.targetServerId === params.targetServerId,
    )
  );
}

function runnerRunObjectiveFor(params: {
  targetKind: RunnerRunTargetKind;
  expectedValue: number;
  expectedAccessCount: number;
  evaluation: RunnerRunTargetEvaluation | undefined;
}): RunnerRunObjective {
  const payoff = params.evaluation?.accessPayoff;
  if (params.targetKind === "rd") {
    if (params.expectedAccessCount > 1) {
      return {
        kind: "access_rnd_multi",
        expectedValue: params.expectedValue,
        expectedAccessCount: params.expectedAccessCount,
      };
    }
    return { kind: "access_rnd_top", expectedValue: params.expectedValue };
  }
  if (params.targetKind === "hq") {
    if (params.expectedAccessCount > 1) {
      return {
        kind: "access_hq_multi",
        expectedValue: params.expectedValue,
        expectedAccessCount: params.expectedAccessCount,
      };
    }
    return { kind: "access_hq_card", expectedValue: params.expectedValue };
  }
  if (params.targetKind === "archives") {
    return { kind: "access_archives", expectedValue: params.expectedValue };
  }
  if (payoff === "agenda" || payoff === "score_threat") {
    return {
      kind: "contest_remote_agenda",
      urgency: params.evaluation?.scoreThreat ? 100 : params.expectedValue,
    };
  }
  if (payoff === "trash_affordable" || payoff === "trash_unaffordable") {
    return {
      kind: "trash_asset_or_upgrade",
      maxTrashCost:
        payoff === "trash_affordable" ? Number.MAX_SAFE_INTEGER : 0,
      expectedValue: params.expectedValue,
    };
  }
  if (payoff === "access_bonus") {
    return {
      kind: "run_card_effect",
      effectId: "access_bonus",
      replacesAccess: false,
    };
  }
  return {
    kind: "probe_unknown_ice",
    riskBudget: {
      maxCreditLoss: Math.max(0, params.evaluation?.pathCost ?? 0),
      maxDamage: 0,
      allowEndTheRun: true,
      evidence: ["run_objective:probe_unknown_ice"],
    },
  };
}

function runnerRunAccessIntentFor(params: {
  targetServerId: RunnerRunPlanServerId;
  expectedAccessCount: number;
  evaluation: RunnerRunTargetEvaluation | undefined;
}): RunnerRunAccessIntent {
  const payoff = params.evaluation?.accessPayoff;
  return {
    server: params.targetServerId,
    expectedAccessCount: params.expectedAccessCount,
    stealAgendaPolicy:
      payoff === "agenda" || payoff === "score_threat"
        ? "must_steal"
        : "steal_if_affordable",
    trashPolicy:
      payoff === "trash_affordable"
        ? "trash_if_value_positive"
        : payoff === "trash_unaffordable"
          ? "must_trash_target"
          : "decline_low_value",
    reserveForStealOrTrash:
      payoff === "trash_affordable" || payoff === "agenda" ? 0 : 0,
  };
}

function runnerRunPlanOriginFor(action: LegalAction): RunnerRunPlanOrigin {
  if (action.payload?.bonusRunNoClick === true) return "followup_run";
  if (action.source !== "basic_action") return "card_initiated_run";
  return "basic_start_run";
}

function numberPayloadValue(
  action: LegalAction,
  key: string,
): number | undefined {
  const value = action.payload?.[key];
  return typeof value === "number" ? value : undefined;
}
