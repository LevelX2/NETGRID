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
