import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
} from "@netgrid/shared";

type SemanticDecisionDebugScoreComponentInput = {
  key: string;
  label: string;
  value: number;
  reason?: string;
};

export type SemanticRuntimeDoctrineScoreDependencies<TConsumer extends string> = {
  rawWeight: (input: AiDecisionInput, planKey: string) => number;
  clamp: (consumer: TConsumer) => number;
  scoreComponent: (
    input: SemanticDecisionDebugScoreComponentInput,
  ) => AiDecisionScoreComponent;
};

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
