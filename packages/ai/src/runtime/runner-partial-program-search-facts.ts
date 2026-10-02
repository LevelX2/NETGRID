import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import type { AiHintEffectTargetProfile } from "../hint-ontology";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { runnerCandidateSourceDefinitionId } from "./runner-action-source-facts";

export function runnerPartialProgramSearchProfile(
  input: AiDecisionInput,
  definitionId: string | undefined,
): AiHintEffectTargetProfile | undefined {
  if (!definitionId) return undefined;
  const profiles =
    AI_HINTS_BY_CARD.get(definitionId)?.targetProfiles?.filter(
      (profile): profile is AiHintEffectTargetProfile =>
        "zone" in profile &&
        profile.zone === "stack_top" &&
        profile.targetCardType === "program" &&
        profile.installsTarget !== true,
    ) ?? [];
  if (!profiles.length) return undefined;
  const profile = profiles[0]!;
  if (
    profiles.length !== 1 ||
    !Number.isSafeInteger(profile.lookCount) ||
    Number(profile.lookCount) <= 0 ||
    !Number.isSafeInteger(profile.costPerTaken) ||
    Number(profile.costPerTaken) < 0
  ) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      owner: "plan_registry",
      removalCondition:
        "A partial own-stack program search requires one canonical bounded look and exact per-card acquisition cost.",
    });
  }
  return profile;
}

export function runnerPartialProgramSearchIsPayable(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType === "install.card") return true;
  const profile = runnerPartialProgramSearchProfile(
    input,
    runnerCandidateSourceDefinitionId(input, candidate),
  );
  if (!profile) return true;
  const action = input.legalActions.find(
    (a) => a.actionId === candidate.actionId,
  );
  if (!action) return false;
  const credits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  return (
    input.playerView.own.gripOrHq.length < input.playerView.own.maxHandSize &&
    input.playerView.own.credits >= credits + profile.costPerTaken!
  );
}
