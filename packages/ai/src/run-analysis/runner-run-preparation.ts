import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { runnerCandidateSourceDefinitionId } from "../runtime/runner-action-source-facts";
import { runnerTargetedIceTrashState } from "../runtime/runner-targeted-ice-trash-plan";
export function runnerSameTurnAccessPreparationSourceDefinitionId(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (candidate.actionType !== "play_event") return undefined;
  const createsSameTurnAccessPayoff = candidate.functionalEffects?.some(
    (effect) =>
      effect.scope === "runner" &&
      effect.timing === "on_access" &&
      (effect.kind === "scored_agenda_action" ||
        effect.kind === "access_replacement" ||
        (effect.kind === "economy" &&
          typeof effect.target === "string" &&
          effect.target.startsWith("next_agenda"))),
  );
  return createsSameTurnAccessPayoff
    ? runnerCandidateSourceDefinitionId(input, candidate)
    : undefined;
}

export function runnerTargetedIceTrashPayoffValue(
  serverId: string,
  baseValue: number,
  runTargets: readonly RunnerRunTargetEvaluation[],
): number {
  return runTargets
    .filter(
      (evaluation) =>
        evaluation.targetServerId === serverId ||
        evaluation.accessServerId === serverId,
    )
    .reduce(
      (best, evaluation) => Math.max(best, evaluation.score),
      Math.max(0, baseValue),
    );
}

export function runnerRezOrTrashPreparationBeatsImmediateRun(params: {
  input: AiDecisionInput;
  targetIceState: ReturnType<typeof runnerTargetedIceTrashState>;
  serverId: string;
  payoffValue: number;
  runTargets: readonly RunnerRunTargetEvaluation[];
}): boolean {
  if (params.targetIceState !== "rez_or_trash") return true;
  const corpCreditPressureValue =
    Math.max(0, 5 - params.input.playerView.opponent.credits) * 20;
  const bestImmediateAlternative = params.runTargets
    .filter(
      (target) =>
        target.targetServerId !== params.serverId &&
        target.accessServerId !== params.serverId &&
        target.recommendation !== "do_not_run_now" &&
        target.recommendation !== "known_no_current_payoff",
    )
    .reduce((best, target) => Math.max(best, target.score), 0);
  return (
    params.payoffValue + corpCreditPressureValue > bestImmediateAlternative
  );
}

export function runnerTargetedBypassPayoffValue(
  serverId: string,
  runTargets: readonly RunnerRunTargetEvaluation[],
): number {
  return runTargets
    .filter((evaluation) => evaluation.targetServerId === serverId)
    .reduce((best, evaluation) => {
      if (
        evaluation.knownAccessState === "known_no_current_payoff" ||
        evaluation.accessPayoff === "known_low_value"
      ) {
        return best;
      }
      const payoffValue =
        evaluation.accessPayoff === "agenda" ||
        evaluation.accessPayoff === "score_threat"
          ? 1_000
          : evaluation.accessPayoff === "trash_affordable" ||
              evaluation.accessPayoff === "access_bonus"
            ? Math.max(300, evaluation.score)
            : evaluation.accessPayoff === "fresh"
              ? Math.max(120, evaluation.score)
              : Math.max(0, evaluation.score);
      return Math.max(best, payoffValue);
    }, 0);
}
