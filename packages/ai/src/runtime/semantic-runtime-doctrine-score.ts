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
