import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

export type RunnerFollowupScoreDependencies = {
  runTargetGuidanceComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  accessTrashComponents: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent[];
  badPublicityRelevanceScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

export function runnerFollowupScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerFollowupScoreDependencies,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const runTargetGuidance = dependencies.runTargetGuidanceComponent(
    input,
    action,
  );
  if (runTargetGuidance) components.push(runTargetGuidance);
  if (
    action.type === "trash_accessed_card" ||
    action.type === "decline_trash"
  ) {
    components.push(...dependencies.accessTrashComponents(input, action));
  }
  const badPublicityRelevance =
    dependencies.badPublicityRelevanceScoreComponent(input, action);
  if (badPublicityRelevance) components.push(badPublicityRelevance);
  return components;
}
