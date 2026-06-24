import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type SemanticDecisionDebugScoreComponentInput = {
  key: string;
  label: string;
  value: number;
  reason?: string;
};

export type SemanticRuntimeDoctrineConsumer =
  | "corp_score_now"
  | "corp_score_next_turn"
  | "corp_build_scoring_remote"
  | "runner_pressure_rnd"
  | "runner_pressure_hq"
  | "runner_contest_remote";

export type SemanticRuntimeDoctrineScoreDependencies<TConsumer extends string> = {
  rawWeight: (input: AiDecisionInput, planKey: string) => number;
  clamp: (consumer: TConsumer) => number;
  scoreComponent: (
    input: SemanticDecisionDebugScoreComponentInput,
  ) => AiDecisionScoreComponent;
};

export type SemanticRuntimeDoctrineScoreContextDependencies = {
  scoreComponent: (
    input: SemanticDecisionDebugScoreComponentInput,
  ) => AiDecisionScoreComponent;
};

export type SemanticRuntimeDoctrineScoreContext = {
  semanticRuntimeDoctrineRawWeight: (
    input: AiDecisionInput,
    planKey: string,
  ) => number;
  semanticRuntimeDoctrinePlanWeightComponent: (
    input: AiDecisionInput,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
  ) => AiDecisionScoreComponent | undefined;
  semanticRuntimeDoctrineSuppressedComponent: (
    evidence: readonly string[],
  ) => AiDecisionScoreComponent;
};

export function createSemanticRuntimeDoctrineScoreContext(
  dependencies: SemanticRuntimeDoctrineScoreContextDependencies,
): SemanticRuntimeDoctrineScoreContext {
  function semanticRuntimeDoctrineRawWeight(
    input: AiDecisionInput,
    planKey: string,
  ): number {
    return input.ownDeckDoctrine?.planWeights[planKey] ?? 0;
  }

  function planWeightComponent(
    input: AiDecisionInput,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
  ): AiDecisionScoreComponent | undefined {
    return semanticRuntimeDoctrinePlanWeightComponent(
      input,
      planKey,
      consumer,
      {
        rawWeight: semanticRuntimeDoctrineRawWeight,
        clamp: semanticRuntimeDoctrineClamp,
        scoreComponent: dependencies.scoreComponent,
      },
    );
  }

  function suppressedComponent(
    evidence: readonly string[],
  ): AiDecisionScoreComponent {
    return semanticRuntimeDoctrineSuppressedComponent(evidence, {
      scoreComponent: dependencies.scoreComponent,
    });
  }

  return {
    semanticRuntimeDoctrineRawWeight,
    semanticRuntimeDoctrinePlanWeightComponent: planWeightComponent,
    semanticRuntimeDoctrineSuppressedComponent: suppressedComponent,
  };
}

export type SemanticRuntimeDoctrineGate = {
  allowed: boolean;
  evidence: string[];
};

export type SemanticRuntimeCorpDoctrineWeightDependencies<
  TConsumer extends string,
> = {
  rawWeight: (input: AiDecisionInput, planKey: string) => number;
  actionGate: (
    input: AiDecisionInput,
    action: LegalAction,
    planKey: string,
    consumer: TConsumer,
  ) => SemanticRuntimeDoctrineGate;
  suppressedComponent: (evidence: readonly string[]) => AiDecisionScoreComponent;
  planWeightComponent: (
    input: AiDecisionInput,
    planKey: string,
    consumer: TConsumer,
  ) => AiDecisionScoreComponent | undefined;
};

export type SemanticRuntimeRunnerLowValueRecoveryContextDependencies = {
  recentRecoveryActions: (input: AiDecisionInput) => number;
  recoveryFundingNeedContext: (input: AiDecisionInput) => {
    active: boolean;
    reason: string;
  };
};

export type SemanticRuntimeDoctrineActionGateContext = {
  serverId?: string | undefined;
};

export type SemanticRuntimeDoctrineActionGateDependencies = {
  actionCreditCost: (action: LegalAction) => number;
  runnerDoctrineActionGate: (
    input: AiDecisionInput,
    action: LegalAction,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
    serverId: string | undefined,
  ) => SemanticRuntimeDoctrineGate;
  corpScoreNowSafetyGate: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeDoctrineGate;
};

export type SemanticRuntimeRunnerDoctrineActionGateDependencies = {
  runnerRunTargetEvaluation: (
    input: AiDecisionInput,
    action: LegalAction,
    serverId: string,
  ) =>
    | {
        pathPassability: string;
        creditsAfterRun: number;
      }
    | undefined;
  recentRunnerStartRunsOnServer: (
    input: AiDecisionInput,
    serverId: string,
  ) => number;
  runnerLowValueRecoveryContext: (input: AiDecisionInput) => {
    active: boolean;
    evidence: string[];
  };
  runnerRemoteContestDoctrineGuard: (
    input: AiDecisionInput,
    action: LegalAction,
    serverId: string,
  ) => SemanticRuntimeDoctrineGate;
};

export type SemanticRuntimeRunnerDoctrineRunWeightDependencies = {
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  rawWeight: (input: AiDecisionInput, planKey: string) => number;
  actionGate: (
    input: AiDecisionInput,
    action: LegalAction,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
    context: SemanticRuntimeDoctrineActionGateContext,
  ) => SemanticRuntimeDoctrineGate;
  suppressedComponent: (evidence: readonly string[]) => AiDecisionScoreComponent;
  planWeightComponent: (
    input: AiDecisionInput,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
  ) => AiDecisionScoreComponent | undefined;
};

export type SemanticRuntimeRunnerRemoteContestEvaluation = {
  knownAccessState: string;
  accessPayoff: string;
  pathPassability: string;
  creditsAfterRun: number;
  recommendation: string;
};

export type SemanticRuntimeRunnerRemoteContestDoctrineGuardDependencies = {
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  runnerRunTargetEvaluation: (
    input: AiDecisionInput,
    action: LegalAction,
    serverId: string,
  ) => SemanticRuntimeRunnerRemoteContestEvaluation | undefined;
  recentRunnerStartRunsOnServer: (
    input: AiDecisionInput,
    serverId: string,
  ) => number;
};

export function semanticRuntimeDoctrineClamp(
  consumer: SemanticRuntimeDoctrineConsumer,
): number {
  switch (consumer) {
    case "corp_score_now":
      return 24;
    case "corp_score_next_turn":
    case "corp_build_scoring_remote":
      return 18;
    case "runner_pressure_rnd":
    case "runner_pressure_hq":
      return 12;
    case "runner_contest_remote":
      return 9;
  }
}

export function semanticRuntimeDoctrineConsumerForPlan(
  planKey: string,
): SemanticRuntimeDoctrineConsumer {
  switch (planKey) {
    case "score_now":
      return "corp_score_now";
    case "score_next_turn":
      return "corp_score_next_turn";
    case "build_scoring_remote":
      return "corp_build_scoring_remote";
    case "pressure_rnd":
      return "runner_pressure_rnd";
    case "pressure_hq":
      return "runner_pressure_hq";
    case "contest_remote":
      return "runner_contest_remote";
    default:
      throw new Error(`Unknown semantic runtime doctrine plan ${planKey}`);
  }
}

export function semanticRuntimeDoctrineGateAllowed(
  consumer: SemanticRuntimeDoctrineConsumer,
): SemanticRuntimeDoctrineGate {
  return {
    allowed: true,
    evidence: [`deck_doctrine_runtime_gate_allowed:${consumer}`],
  };
}

export function semanticRuntimeDoctrineGateBlocked(
  planKey: string,
  consumer: SemanticRuntimeDoctrineConsumer,
  reason: string,
  evidence: string[] = [],
): SemanticRuntimeDoctrineGate {
  return {
    allowed: false,
    evidence: [
      "deck_doctrine_runtime_gate_suppressed:true",
      `plan:${planKey}`,
      `consumer:${consumer}`,
      `deck_doctrine_runtime_gate_reason:${reason}`,
      ...evidence,
    ],
  };
}

export function semanticRuntimeDoctrineActionGate(
  input: AiDecisionInput,
  action: LegalAction,
  planKey: string,
  consumer: SemanticRuntimeDoctrineConsumer,
  dependencies: SemanticRuntimeDoctrineActionGateDependencies,
  context: SemanticRuntimeDoctrineActionGateContext = {},
): SemanticRuntimeDoctrineGate {
  if (
    !input.legalActions.some(
      (legalAction) => legalAction.actionId === action.actionId,
    )
  ) {
    return semanticRuntimeDoctrineGateBlocked(
      planKey,
      consumer,
      "illegal_action",
      [`action:${action.actionId}`],
    );
  }
  if (action.side !== input.side) {
    return semanticRuntimeDoctrineGateBlocked(
      planKey,
      consumer,
      "side_mismatch",
      [`input_side:${input.side}`, `action_side:${action.side}`],
    );
  }
  const cost = dependencies.actionCreditCost(action);
  if (cost > input.playerView.own.credits) {
    return semanticRuntimeDoctrineGateBlocked(planKey, consumer, "cost_blocked", [
      `credits:${input.playerView.own.credits}`,
      `cost:${cost}`,
    ]);
  }

  if (
    consumer === "runner_pressure_rnd" ||
    consumer === "runner_pressure_hq" ||
    consumer === "runner_contest_remote"
  ) {
    return dependencies.runnerDoctrineActionGate(
      input,
      action,
      planKey,
      consumer,
      context.serverId,
    );
  }
  if (consumer === "corp_score_now") {
    const scoreGate = dependencies.corpScoreNowSafetyGate(input, action);
    if (!scoreGate.allowed) {
      return semanticRuntimeDoctrineGateBlocked(
        planKey,
        consumer,
        "unsafe_score",
        [
          "corp_scoreline_safety_gate_blocks_doctrine:true",
          "score_now_doctrine_suppressed:true",
          ...scoreGate.evidence,
        ],
      );
    }
  }
  return semanticRuntimeDoctrineGateAllowed(consumer);
}

export function semanticRuntimeDoctrinePlanWeightComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  planKey: string,
  consumer: TConsumer,
  dependencies: SemanticRuntimeDoctrineScoreDependencies<TConsumer>,
): AiDecisionScoreComponent | undefined {
  const raw = dependencies.rawWeight(input, planKey);
  const clamp = dependencies.clamp(consumer);
  const bounded = Math.max(-clamp, Math.min(clamp, raw));
  const value = Math.round(bounded * 10);
  if (value === 0) return undefined;
  return {
    key: "deck_doctrine_runtime_weight",
    label: "DeckDoctrine-Runtime-Gewicht",
    value,
    reason: [
      `plan:${planKey}`,
      `raw:${raw}`,
      `bounded:${bounded}`,
      `consumer:${consumer}`,
      `clamp:${clamp}`,
      `tags:${input.ownDeckDoctrine?.archetypeTags.slice(0, 3).join(",") ?? "neutral"}`,
    ].join("|"),
  };
}

export function semanticRuntimeDoctrineSuppressedComponent(
  evidence: readonly string[],
  dependencies: Pick<
    SemanticRuntimeDoctrineScoreDependencies<string>,
    "scoreComponent"
  >,
): AiDecisionScoreComponent {
  return dependencies.scoreComponent({
    key: "deck_doctrine_runtime_weight_suppressed",
    label: "DeckDoctrine-Runtime-Gewicht unterdrückt",
    value: 0,
    reason: evidence.join("|"),
  });
}

export function semanticRuntimeCorpDoctrineWeight<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  planKey: string,
  consumer: TConsumer,
  dependencies: SemanticRuntimeCorpDoctrineWeightDependencies<TConsumer>,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "corp" || input.ownDeckDoctrine?.side !== "corp")
    return undefined;
  const raw = dependencies.rawWeight(input, planKey);
  const gate = dependencies.actionGate(input, action, planKey, consumer);
  if (raw > 0 && !gate.allowed) {
    return dependencies.suppressedComponent(gate.evidence);
  }
  return dependencies.planWeightComponent(input, planKey, consumer);
}

export function semanticRuntimeCorpScoreNowDoctrineWeight<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  consumer: TConsumer,
  dependencies: SemanticRuntimeCorpDoctrineWeightDependencies<TConsumer>,
): AiDecisionScoreComponent | undefined {
  return semanticRuntimeCorpDoctrineWeight(
    input,
    action,
    "score_now",
    consumer,
    dependencies,
  );
}

export function semanticRuntimeRunnerLowValueRecoveryContext(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeRunnerLowValueRecoveryContextDependencies,
): { active: boolean; evidence: string[] } {
  const recentRecovery = dependencies.recentRecoveryActions(input);
  if (recentRecovery <= 1) return { active: false, evidence: [] };
  const fundingNeed = dependencies.recoveryFundingNeedContext(input);
  if (fundingNeed.active) return { active: false, evidence: [] };
  return {
    active: true,
    evidence: [
      `recent_recovery:${recentRecovery}`,
      "funding_need:false",
      `funding_context:${fundingNeed.reason}`,
    ],
  };
}

export function semanticRuntimeRunnerDoctrineActionGate(
  input: AiDecisionInput,
  action: LegalAction,
  planKey: string,
  consumer: SemanticRuntimeDoctrineConsumer,
  serverId: string | undefined,
  dependencies: SemanticRuntimeRunnerDoctrineActionGateDependencies,
): SemanticRuntimeDoctrineGate {
  if (action.type !== "start_run") {
    return semanticRuntimeDoctrineGateBlocked(
      planKey,
      consumer,
      "not_run_action",
    );
  }
  if (!serverId) {
    return semanticRuntimeDoctrineGateBlocked(
      planKey,
      consumer,
      "missing_server",
    );
  }
  const evaluation = dependencies.runnerRunTargetEvaluation(
    input,
    action,
    serverId,
  );
  if (
    evaluation &&
    (evaluation.pathPassability !== "reachable" ||
      evaluation.creditsAfterRun < 0)
  ) {
    return semanticRuntimeDoctrineGateBlocked(
      planKey,
      consumer,
      "cost_or_reachability_blocked",
      [
        `target:${serverId}`,
        `path:${evaluation.pathPassability}`,
        `credits_after:${evaluation.creditsAfterRun}`,
      ],
    );
  }
  if (
    (consumer === "runner_pressure_rnd" || consumer === "runner_pressure_hq") &&
    dependencies.recentRunnerStartRunsOnServer(input, serverId) > 0
  ) {
    return semanticRuntimeDoctrineGateBlocked(
      planKey,
      consumer,
      "repeated_no_progress_run",
      [`target:${serverId}`],
    );
  }
  const recoveryContext = dependencies.runnerLowValueRecoveryContext(input);
  if (recoveryContext.active) {
    return semanticRuntimeDoctrineGateBlocked(
      planKey,
      consumer,
      "low_value_recovery_context",
      recoveryContext.evidence,
    );
  }
  if (consumer === "runner_contest_remote") {
    const remoteContestGate = dependencies.runnerRemoteContestDoctrineGuard(
      input,
      action,
      serverId,
    );
    if (!remoteContestGate.allowed) return remoteContestGate;
  }
  return semanticRuntimeDoctrineGateAllowed(consumer);
}

export function semanticRuntimeRunnerDoctrineRunWeight(
  input: AiDecisionInput,
  action: LegalAction,
  serverId: string | undefined,
  dependencies: SemanticRuntimeRunnerDoctrineRunWeightDependencies,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || input.ownDeckDoctrine?.side !== "runner")
    return undefined;
  const planKey =
    serverId === "rd"
      ? "pressure_rnd"
      : serverId === "hq"
        ? "pressure_hq"
        : dependencies.isRemoteServerTarget(serverId)
          ? "contest_remote"
          : undefined;
  if (!planKey) return undefined;
  const consumer = semanticRuntimeDoctrineConsumerForPlan(planKey);
  const raw = dependencies.rawWeight(input, planKey);
  const gate = dependencies.actionGate(input, action, planKey, consumer, {
    serverId,
  });
  if (raw > 0 && !gate.allowed) {
    return dependencies.suppressedComponent(gate.evidence);
  }
  return dependencies.planWeightComponent(input, planKey, consumer);
}

export function semanticRuntimeRunnerRemoteContestDoctrineGuard(
  input: AiDecisionInput,
  action: LegalAction,
  serverId: string | undefined,
  dependencies: SemanticRuntimeRunnerRemoteContestDoctrineGuardDependencies,
): SemanticRuntimeDoctrineGate {
  if (!serverId || !dependencies.isRemoteServerTarget(serverId)) {
    return {
      allowed: false,
      evidence: [
        "deck_doctrine_remote_contest_suppressed:true",
        "deck_doctrine_remote_contest_suppressed_reason:not_remote",
      ],
    };
  }
  const evaluation = dependencies.runnerRunTargetEvaluation(
    input,
    action,
    serverId,
  );
  if (!evaluation) {
    return {
      allowed: false,
      evidence: [
        "deck_doctrine_remote_contest_suppressed:true",
        "deck_doctrine_remote_contest_suppressed_reason:missing_evaluation",
      ],
    };
  }
  const knownNoPayoff =
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoff === "known_low_value";
  const blocked =
    evaluation.pathPassability !== "reachable" ||
    evaluation.creditsAfterRun < 0;
  const repeated =
    dependencies.recentRunnerStartRunsOnServer(input, serverId) > 0;
  const plausiblePayoff =
    evaluation.accessPayoff === "agenda" ||
    evaluation.accessPayoff === "score_threat" ||
    evaluation.accessPayoff === "trash_affordable" ||
    evaluation.accessPayoff === "fresh" ||
    evaluation.accessPayoff === "access_bonus" ||
    (evaluation.accessPayoff === "unknown" &&
      evaluation.recommendation === "run_now");
  if (
    knownNoPayoff ||
    blocked ||
    (repeated && !plausiblePayoff) ||
    !plausiblePayoff
  ) {
    return {
      allowed: false,
      evidence: [
        "deck_doctrine_remote_contest_suppressed:true",
        ...(knownNoPayoff ? ["runner_known_remote_no_payoff_guard:true"] : []),
        `deck_doctrine_remote_contest_suppressed_reason:${
          knownNoPayoff
            ? "known_no_payoff"
            : blocked
              ? "blocked_or_unreachable"
              : repeated
                ? "repeated_without_payoff"
                : "no_plausible_payoff"
        }`,
        `target:${serverId}`,
        `known_access:${evaluation.knownAccessState}`,
        `payoff:${evaluation.accessPayoff}`,
        `path:${evaluation.pathPassability}`,
        `credits_after:${evaluation.creditsAfterRun}`,
        `repeated_remote:${repeated}`,
      ],
    };
  }
  return {
    allowed: true,
    evidence: [
      "deck_doctrine_remote_contest_allowed:true",
      `target:${serverId}`,
      `payoff:${evaluation.accessPayoff}`,
    ],
  };
}
