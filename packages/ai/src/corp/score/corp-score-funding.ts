import {
  CorpScoreFundingMilestone,
  CorpScoreProjectSignal,
} from "../../plans/corp-score-contracts";
import type { PriorityClass } from "../../plans/plan-assessment";
import {
  corpScorePriorityClass,
  knownScoreProtectionFundingGap,
} from "./corp-score-priority";

export function corpScoreFundingMilestone(
  signal: CorpScoreProjectSignal,
  observedCredits: number,
): CorpScoreFundingMilestone | undefined {
  if (
    !Number.isSafeInteger(observedCredits) ||
    observedCredits < 0 ||
    signal.phase === "select_agenda" ||
    signal.evidenceCode.startsWith(
      "corp_resident_score_parent_dominates_sibling_route:",
    )
  ) {
    return undefined;
  }
  const routeFundingGap =
    typeof signal.fundingGap === "number" &&
    Number.isSafeInteger(signal.fundingGap) &&
    signal.fundingGap > 0
      ? signal.fundingGap
      : 0;
  const protectionFundingGap = knownScoreProtectionFundingGap(signal);
  const fundingOptions = [routeFundingGap, protectionFundingGap ?? 0].filter(
    (gap) => gap > 0,
  );
  const fundingGap =
    fundingOptions.length > 0 ? Math.min(...fundingOptions) : 0;
  const continuationTarget =
    signal.continuationReserve &&
    Number.isSafeInteger(
      signal.continuationReserve.requiredCreditsBeforeNextCorpTurn,
    ) &&
    signal.continuationReserve.requiredCreditsBeforeNextCorpTurn >= 0
      ? signal.continuationReserve.requiredCreditsBeforeNextCorpTurn
      : 0;
  const conversionTarget =
    signal.conversion &&
    Number.isSafeInteger(signal.conversion.remainingScoreCredits) &&
    signal.conversion.remainingScoreCredits >= 0
      ? signal.conversion.remainingScoreCredits
      : 0;
  const incrementalFundingTarget =
    fundingGap > 0 ? observedCredits + fundingGap : 0;
  const targetCredits = Math.max(
    incrementalFundingTarget,
    conversionTarget,
    continuationTarget,
  );
  if (targetCredits <= 0) return undefined;
  const priorityClass = corpScorePriorityClass(signal);
  const protectionNeed = signal.protectionNeed;
  const basis: CorpScoreFundingMilestone["basis"] =
    targetCredits === incrementalFundingTarget &&
    protectionFundingGap === fundingGap &&
    protectionNeed
      ? {
          kind: "score_protection_gap",
          needId: protectionNeed.needId,
          observedAtStateVersion: protectionNeed.observedAtStateVersion,
        }
      : targetCredits === incrementalFundingTarget
        ? { kind: "score_route_gap" }
        : targetCredits === conversionTarget
          ? { kind: "score_conversion_floor" }
          : { kind: "score_continuation_floor" };
  return {
    kind: "score_credit_milestone",
    basis,
    targetCredits,
    observedCredits,
    remainingGap: Math.max(0, targetCredits - observedCredits),
    priorityClass,
    hardness: priorityClass === "P4" ? "soft" : "hard",
    deadline: signal.sameTurnCloseout
      ? "current_turn"
      : signal.continuationReserve
        ? "next_corp_turn"
        : "multi_turn",
    releaseCondition: "parent_invalidated_or_higher_priority_preemption",
  };
}

export type CorpScoreFundingSpendAssessment = Readonly<{
  preservesMilestone: boolean;
  protectedCredits: number;
  availableCreditsAfterAction: number;
  projectId?: string;
}>;

/**
 * Lower-priority siblings consume the exact milestone published by the score
 * parent. Equal- or higher-priority routes remain scheduler preemptions; this
 * helper never promotes or owns such a route.
 */
export function assessCorpSpendAgainstScoreFundingMilestones(params: {
  currentCredits: number;
  actionCreditCost: number | undefined;
  actionPriorityClass: PriorityClass;
  scoreProjects: readonly CorpScoreProjectSignal[];
}): CorpScoreFundingSpendAssessment {
  const priorityRank: Record<PriorityClass, number> = {
    P1: 1,
    P2: 2,
    P3: 3,
    P4: 4,
    P5: 5,
    P6: 6,
  };
  const claim = params.scoreProjects
    .flatMap((project) => {
      const milestone = project.fundingMilestone;
      if (
        !milestone ||
        milestone.kind !== "score_credit_milestone" ||
        milestone.observedCredits !== params.currentCredits ||
        !Number.isSafeInteger(milestone.targetCredits) ||
        milestone.targetCredits <= 0 ||
        priorityRank[milestone.priorityClass] >=
          priorityRank[params.actionPriorityClass]
      ) {
        return [];
      }
      return [{ project, milestone }];
    })
    .sort(
      (left, right) =>
        priorityRank[left.milestone.priorityClass] -
          priorityRank[right.milestone.priorityClass] ||
        Number(right.milestone.hardness === "hard") -
          Number(left.milestone.hardness === "hard") ||
        right.milestone.targetCredits - left.milestone.targetCredits ||
        left.project.projectId.localeCompare(right.project.projectId),
    )[0];
  if (!claim) {
    return {
      preservesMilestone: true,
      protectedCredits: 0,
      availableCreditsAfterAction: params.currentCredits,
    };
  }
  const protectedCredits = Math.min(
    claim.milestone.targetCredits,
    claim.milestone.observedCredits,
  );
  const exactCost =
    typeof params.actionCreditCost === "number" &&
    Number.isSafeInteger(params.actionCreditCost) &&
    params.actionCreditCost >= 0
      ? params.actionCreditCost
      : undefined;
  const availableCreditsAfterAction =
    exactCost === undefined
      ? Number.NEGATIVE_INFINITY
      : params.currentCredits - exactCost;
  return {
    preservesMilestone: availableCreditsAfterAction >= protectedCredits,
    protectedCredits,
    availableCreditsAfterAction,
    projectId: claim.project.projectId,
  };
}
