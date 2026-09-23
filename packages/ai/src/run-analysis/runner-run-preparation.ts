import { type AiDecisionInput } from "@netgrid/shared";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import { runnerCandidateSourceDefinitionId } from "../runtime/runner-action-source-facts";
import { runnerTargetedIceTrashState } from "../runtime/runner-targeted-ice-trash-plan";
import { actionClickCost, actionCreditCost } from "../runtime/action-cost";
import { runnerRunTargetCanConvertNow } from "./runner-plan-run-funding";

export function runnerRunReplacesAgendaAccess(
  input: AiDecisionInput,
  target: RunnerRunTargetEvaluation,
): boolean {
  if (target.runActionProjection.accessReplacement) return true;
  const run = input.legalActions.find((a) => a.actionId === target.actionId);
  if (!run) return true;
  // Event payloads need not duplicate the replacement on the exact printed
  // make-run capability. This is a source fact, not a card-name heuristic.
  const source = target.runActionProjection.sourceCardId;
  const capability = run.payload?.cardImplementationAbilityKey;
  const boundAbility =
    source && typeof capability === "string"
      ? cardSpecPlanningCardByDefinitionId(
          source,
        )?.planning.engine.abilities?.find(
          (ability) => ability.capabilityKey === capability,
        )
      : undefined;
  return Boolean(
    boundAbility?.effects.some(
      (effect) =>
        effect.kind === "make_run" &&
        effect.successfulRunAccessReplacement !== undefined,
    ),
  );
}

/** Admission of an access payoff must include the preparation's own spend. */
export function runnerSameTurnAccessPreparationFitsTarget(
  input: AiDecisionInput,
  preparationActionId: string,
  target: RunnerRunTargetEvaluation,
  continuation: {
    economy: RunnerEconomyPosture;
    candidates: readonly ActionSemanticCandidate[];
    minimumHandBuffer: number;
  },
): boolean {
  const preparation = input.legalActions.find(
    (a) => a.actionId === preparationActionId,
  );
  const run = input.legalActions.find((a) => a.actionId === target.actionId);
  const reserve = target.prerunReserveQuote;
  if (
    !preparation ||
    !run ||
    !reserve ||
    runnerRunReplacesAgendaAccess(input, target)
  )
    return false;
  const credits = actionCreditCost(preparation);
  // Quote the already bound route after the current legal preparation's spend.
  // Reuse the executing owner's funding admission rather than treating run_now
  // as proof that its protected post-run reserve is already available.
  const afterPreparation: AiDecisionInput = {
    ...input,
    playerView: {
      ...input.playerView,
      own: {
        ...input.playerView.own,
        credits: input.playerView.own.credits - credits,
        clicks: input.playerView.own.clicks - actionClickCost(preparation),
      },
    },
  };
  const handAfterPreparation = input.playerView.own.gripOrHq.length - 1;
  return (
    actionClickCost(preparation) + actionClickCost(run) <=
      input.playerView.own.clicks &&
    target.creditsAfterRun - credits >= 0 &&
    reserve.creditsAfterKnownPath - credits >= reserve.requiredCredits &&
    handAfterPreparation >= reserve.requiredHandBuffer &&
    (target.pathCost === 0 ||
      target.accessPayoff === "agenda" ||
      target.accessPayoff === "score_threat" ||
      handAfterPreparation >= continuation.minimumHandBuffer) &&
    runnerRunTargetCanConvertNow(
      afterPreparation,
      continuation.economy,
      { ...target, creditsAfterRun: target.creditsAfterRun - credits },
      continuation.candidates,
    )
  );
}
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
