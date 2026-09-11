import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import { type RunnerPlanDomain } from "../plans/runner-tactical-plan-contracts";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";

export function runnerCentralPayoffServerForDefinition(
  definitionId: string,
): "hq" | "rd" | "archives" | undefined {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const signals = new Set([
    ...(hint?.functionSignals ?? []),
    ...(hint?.tacticSignals ?? []),
    ...(hint?.actionTacticSignals ?? []),
  ]);
  const planRoles = new Set(hint?.planRoles ?? []);
  if (
    signals.has("access.rnd_multiaccess") ||
    signals.has("run.rd") ||
    signals.has("run.rnd") ||
    planRoles.has("pressure_rnd")
  ) {
    return "rd";
  }
  if (
    signals.has("access.hq_multiaccess") ||
    signals.has("run.hq") ||
    planRoles.has("pressure_hq")
  ) {
    return "hq";
  }
  return undefined;
}

export function runnerAccessPayoffCampaignTargetIsViable(
  input: AiDecisionInput,
  target: RunnerRunTargetEvaluation,
  coverageGaps: RunnerPlanDomain["coverageGaps"],
): boolean {
  if (
    target.score <= 0 ||
    target.knownAccessState === "known_no_current_payoff" ||
    target.accessPayoff === "known_low_value" ||
    target.accessPayoffContestable === false ||
    target.pathPassability === "blocked_unbreakable" ||
    target.pathPassability === "blocked_by_random_break_damage_hand_buffer" ||
    target.pathPassability === "blocked_by_visible_damage_hand_buffer"
  ) {
    return false;
  }
  if (target.pathPassability === "reachable") return true;
  if (target.pathPassability === "blocked_missing_coverage") {
    return coverageGaps.some(
      (gap) =>
        (gap.targetServerId === undefined ||
          gap.targetServerId === target.targetServerId) &&
        (gap.answerInHand || (gap.directSearchActionIds?.length ?? 0) > 0),
    );
  }
  return (
    target.pathPassability === "blocked_unpayable" &&
    Number.isSafeInteger(target.pathCost) &&
    target.pathCost <= input.playerView.own.credits + 12 &&
    target.recommendation === "gain_credits_first"
  );
}

export function runnerCentralPayoffServer(
  candidate: ActionSemanticCandidate,
): "hq" | "rd" | "archives" | undefined {
  const targets = new Set(candidate.effectTargets ?? []);
  if (
    targets.has("rd") ||
    targets.has("rnd") ||
    candidate.actionTacticSignals.includes("access.rnd_multiaccess")
  ) {
    return "rd";
  }
  if (
    targets.has("hq") ||
    candidate.actionTacticSignals.includes("access.hq_multiaccess")
  ) {
    return "hq";
  }
  if (targets.has("archives")) return "archives";
  return candidate.sourceDefinitionId
    ? runnerCentralPayoffServerForDefinition(candidate.sourceDefinitionId)
    : undefined;
}
