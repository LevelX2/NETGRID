import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

type TagCleanupReduction =
  NonNullable<ActionSemanticCandidate["tagEffectProfile"]>["currentTagReduction"];

export function runnerTagCleanupScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  const currentTags = input.playerView.own.tags;
  if (currentTags <= 0) return undefined;
  const profile = actionSemanticCandidate?.tagEffectProfile;
  const acuteTagRemoval =
    profile?.acuteTagRemoval === true || action.type === "remove_tag";
  if (!acuteTagRemoval) return undefined;
  const reduction = tagCleanupReduction(profile?.currentTagReduction, currentTags);
  const value = 900 + Math.max(0, reduction - 1) * 150;
  return {
    key: "runner_tags_present",
    label: "Tags entfernen",
    value,
    reason: `tags:${currentTags};reduction:${reduction}`,
  };
}

export function runnerDirectTagCleanupFallbackScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  tagCleanupComponent: AiDecisionScoreComponent | undefined,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "remove_tag") return undefined;
  if (input.playerView.own.tags <= 0 || tagCleanupComponent) return undefined;
  return {
    key: "runner_tags_present",
    label: "Tags entfernen",
    value: 900,
    reason: `tags:${input.playerView.own.tags}`,
  };
}

function tagCleanupReduction(
  reduction: TagCleanupReduction | undefined,
  currentTags: number,
): number {
  if (reduction === "all") return currentTags;
  if (typeof reduction === "number") return Math.min(reduction, currentTags);
  return 1;
}
